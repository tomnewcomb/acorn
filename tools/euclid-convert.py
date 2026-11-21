from pathlib import Path
import struct,json,math,collections
import numpy as np
import shapely
from shapely.geometry import LineString
from shapely.ops import unary_union,polygonize

def convert(source):
 b=Path(source).read_bytes();u=lambda p:struct.unpack_from('<I',b,p)[0];base=u(0);rs={};p=80
 while p<len(b):
  word=u(p);tag=word>>24;n=word&65535
  if tag in [48,49,64]:size=32+8*n+(4 if tag==49 else 0)
  elif tag==80:size=32
  elif tag in [32,33,34,35]:size=4+n*{32:12,33:20,34:16,35:24}[tag]
  else:raise ValueError(f'Unknown record {word:08x} at {p:x}')
  assert p+size<=len(b);rs[p]={'tag':tag,'n':n,'size':size};p+=size
 assert p==len(b)
 unknown=0xfffff000;surfaces=[];strokes=[];names=[];transforms=[];camera_count=0
 def colour(value):
  if value>>24!=0x80:return [.4,.43,.41]
  return [(value&255)/255,((value>>8)&255)/255,((value>>16)&255)/255]
 def matrix(off):
  assert off in rs and rs[off]['tag']==80
  x,y,z,s,ax,ay,az=struct.unpack_from('<7i',b,off+4);transforms.append((s,ax,ay,az));a,c,d=[v/64*math.pi/180 for v in [ax,ay,az]]
  rx=np.array([[1,0,0],[0,math.cos(a),-math.sin(a)],[0,math.sin(a),math.cos(a)]]);ry=np.array([[math.cos(c),0,math.sin(c)],[0,1,0],[-math.sin(c),0,math.cos(c)]]);rz=np.array([[math.cos(d),-math.sin(d),0],[math.sin(d),math.cos(d),0],[0,0,1]])
  m=np.eye(4);m[:3,:3]=rx@ry@rz*s/65536;m[:3,3]=[x,y,z];return m
 def path(off,m):
  r=rs[off];t=r['tag'];stride={32:12,33:20,34:16,35:24}[t];points=[]
  for i in range(r['n']):
   at=off+4+i*stride+(8 if t in [33,35] else 0)+(4 if t in [34,35] else 0);x,y,z=struct.unpack_from('<3i',b,at);points.append((m@np.array([x,y,z,1]))[:3])
  return np.array(points)
 def tri(v,value,name):
  v=np.array(v,float)
  if np.linalg.norm(np.cross(v[1]-v[0],v[2]-v[0]))>1e-5:surfaces.append({'p':np.round(v,4).flatten().tolist(),'c':colour(value),'name':name})
 def line(points,value,name):
  for a,c in zip(points[:-1],points[1:]):
   if np.linalg.norm(a-c)>1e-6:strokes.append({'p':np.round(np.array([a,c]),4).flatten().tolist(),'c':colour(value),'name':name})
 def fill(points,value,name):
  if len(points)<3:return
  centre=points.mean(axis=0);_,s,vh=np.linalg.svd(points-centre)
  if len(s)<2 or s[1]<1e-6:return
  axes=vh[:2];p=(points-centre)@axes.T;closed=np.vstack([p,p[0]]);segments=[LineString([a,c]) for a,c in zip(closed[:-1],closed[1:]) if np.linalg.norm(a-c)>1e-6]
  def inside(x,y):
   hit=False
   for a,c in zip(closed[:-1],closed[1:]):
    if (a[1]>y)!=(c[1]>y) and x<(c[0]-a[0])*(y-a[1])/(c[1]-a[1])+a[0]:hit=not hit
   return hit
  for region in polygonize(unary_union(segments)):
   sample=region.representative_point()
   if not inside(sample.x,sample.y):continue
   for t in shapely.constrained_delaunay_triangles(region).geoms:tri(centre+np.array(t.exterior.coords)[:3]@axes,value,name)
 def walk(off,m=np.eye(4),value=unknown,parents=(),ancestors=()):
  nonlocal camera_count
  assert off not in ancestors,'Cyclic object reference'
  r=rs[off];tag=r['tag']
  if tag in [48,49,64]:
   name=b[off+4:off+20].split(b'\r')[0].decode('latin1');parents=parents+(name,)
   if name=='!Camera':camera_count+=1;return
   if name not in names:names.append(name)
   p=off+32+(4 if tag==49 else 0);children=[]
   for i in range(r['n']):
    a,c=struct.unpack_from('<2I',b,p+i*8);is_transform=base<=a<base+len(b);local=matrix(a-base-12) if is_transform else np.eye(4);target=c-base-12;assert target in rs
    children.append((target,m@local,value if is_transform else a))
   full='/'.join(parents)
   if tag==49:
    curves=[path(c,t) for c,t,v in children];assert len(set(len(c) for c in curves))<=1
    for c,(_,t,v) in zip(curves,children):line(c,v,full)
    for i in range(len(curves)-1+(1 if len(curves)>2 else 0)):
     ca,cb=curves[i],curves[(i+1)%len(curves)];v=children[i][2]
     for j in range(len(ca)):line([ca[j],cb[j]],v,full)
     for j in range(len(ca)-1+(1 if len(ca)>2 else 0)):
      k=(j+1)%len(ca);q=[ca[j],ca[k],cb[k],cb[j]];tri([q[0],q[1],q[2]],v,full);tri([q[0],q[2],q[3]],v,full)
    if curves and len(curves[0])>2:fill(curves[0],children[0][2],full);fill(curves[-1],children[-1][2],full)
   else:
    for c,t,v in children:walk(c,t,v,parents,ancestors+(off,))
  elif tag in [32,33,34,35]:
   points=path(off,m);full='/'.join(parents);line(points,value,full);fill(points,value,full)
  else:raise ValueError(tag)
 root=u(0x34)-base-12
 assert root in rs and rs[root]['tag'] in [48,49,64],'Invalid root object reference'
 walk(root)
 # Convert source handedness after all nested source transforms are applied.
 # Reflect Z, and reverse triangle winding so surface orientation is preserved.
 for item in surfaces+strokes:
  for i in range(2,len(item['p']),3):item['p'][i]=-item['p'][i]
 for item in surfaces:item['p'][3:9]=item['p'][6:9]+item['p'][3:6]
 assert surfaces or strokes
 points=np.array([p for s in strokes for p in np.array(s['p']).reshape(-1,3)]);bounds=[points.min(axis=0).tolist(),points.max(axis=0).tolist()]
 return {'triangles':surfaces,'lines':strokes,'bounds':bounds,'objects':names,'sourceBytes':len(b),'coordinateConversion':'Source Z reflected after instancing; triangle winding reversed','rootOffset':root,'recordCount':len(rs),'cameraObjectsOmitted':camera_count,'recordTypes':dict(collections.Counter(r['tag'] for r in rs.values()))}

if __name__=='__main__':
 import argparse
 parser=argparse.ArgumentParser(description='Decode the observed Acorn Euclid model records into browser geometry.')
 parser.add_argument('source',type=Path)
 parser.add_argument('output',type=Path)
 args=parser.parse_args()
 data=convert(args.source)
 args.output.write_text(json.dumps(data,separators=(',',':'))+'\n')
 print(f"Decoded {data['recordCount']} records, {len(data['triangles'])} triangles and {len(data['lines'])} line segments")
