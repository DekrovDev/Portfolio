/* Canvas 2D water for browsers that cannot create/compile a WebGL context.
   The same moving height field is projected and shaded on the CPU. No image
   stretching, libraries, downloads or server are involved. */
(() => {
  window.portfolioWaterFallback = layer => {
    const canvas = document.createElement('canvas');
    canvas.className = 'wave-canvas wave-software';
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return null;
    layer.append(canvas);
    const columns = 128, rows = 112, count = (columns + 1) * (rows + 1);
    const positions = new Float32Array(count * 2);
    const projected = new Float32Array(count * 4);
    const hills = [[5,0,.23,1.6,11,2,1],[-7,-5,-.48,1.8,7,1.6,5],
      [12,-10,.55,1.4,10,2.5,9],[-2,-18,-.16,2,12,1.7,15],[16,-27,.37,1.9,10,2.1,21]];
    const parameters = hills.map(([x,z,angle,width,length,size,seed]) =>
      ({x,z,c:Math.cos(angle),s:Math.sin(angle),width,length,size,seed}));
    const bands = [[2.9,1.4,.020,1.65,0],[-4.3,2.7,.011,2.13,1.7]];
    const clamp = v => Math.min(1, Math.max(0, v));
    const smooth = (a,b,v) => { const f=clamp((v-a)/(b-a)); return f*f*(3-2*f); };
    let width, height, pixels, depth, cameraX;
    for (let row=0, i=0; row<=rows; row++) {
      for (let col=0; col<=columns; col++) {
        positions[i++] = -24 + col/columns*48;
        positions[i++] = -38 + row/rows*45;
      }
    }
    const shadeVertex = (x,z,time,index) => {
      let h=0, sx=0, sz=0;
      for (const p of parameters) {
        const px=x-p.x, pz=z-p.z, along=px*p.c+pz*p.s, across=-px*p.s+pz*p.c;
        const phase=time*(.24+p.seed*.007), a=along*.22+p.seed+phase;
        const b=along*.47-p.seed*.7-phase*.67, c=along*.32-phase*2.1+p.seed;
        const side=across-Math.sin(a)*1.1-Math.sin(b)*.35-Math.sin(c)*.42;
        const curveSlope=Math.cos(a)*.242+Math.cos(b)*.1645+Math.cos(c)*.1344;
        const f=clamp(side+.5), blend=f*f*f*(f*(f*6-15)+10);
        const flank=p.width*(1.3-.52*blend), flankSlope=-p.width*.52*30*f*f*(1-f)*(1-f);
        const r=side/flank, crest=Math.exp(-r*r), envelope=Math.exp(-along*along/(p.length*p.length));
        const swellPhase=along*.36-phase*2.8+p.seed, swell=1+.12*Math.sin(swellPhase);
        const cross=p.size*(-2*r*(flank-side*flankSlope)/(flank*flank)*crest)*envelope*swell;
        const axis=p.size*crest*(-2*along/(p.length*p.length)*envelope*swell+envelope*.0432*Math.cos(swellPhase));
        h += p.size*crest*envelope*swell;
        sx += cross*(-p.s-p.c*curveSlope)+axis*p.c;
        sz += cross*(p.c-p.s*curveSlope)+axis*p.s;
      }
      const a=x*.95+z*.57-time*.82, b=x*-.71+z*1.36-time*1.05;
      h=h*.88+.075*Math.sin(a)+.045*Math.sin(b)-.45;
      sx=sx*.88+.075*Math.cos(a)*.95-.045*Math.cos(b)*.71;
      sz=sz*.88+.075*Math.cos(a)*.57+.045*Math.cos(b)*1.36;
      const ry=h-4.8, rz=z-8.5, distance=-.278543*ry-.960429*rz;
      const inv=1/Math.max(.01,distance), focal=height*.975;
      projected[index]=width*.5+(x-cameraX)*focal*inv;
      projected[index+1]=height*.5-(.960429*ry-.278543*rz)*focal*inv;
      projected[index+2]=distance>.2 ? inv : 0;
      for (const [kx,kz,amplitude,speed,phase] of bands) {
        const detail=amplitude*Math.cos(x*kx+z*kz-time*speed+phase)/(1+distance*.032);
        sx+=kx*detail; sz+=kz*detail;
      }
      const norm=1/Math.hypot(sx,1,sz), nx=-sx*norm, ny=norm, nz=-sz*norm;
      const vn=1/Math.hypot(cameraX-x,-ry,-rz), vx=(cameraX-x)*vn, vy=-ry*vn, vz=-rz*vn;
      const nv=Math.max(0,nx*vx+ny*vy+nz*vz), fresnel=.02+.98*(1-nv)**5;
      const rx=-vx+2*nv*nx, reflectedY=-vy+2*nv*ny;
      const sky=.002+.018*smooth(-.1,.7,reflectedY);
      const horizon=Math.exp(-(((reflectedY-.12)/.12)**2))*(.35+.65*smooth(-.6,.55,rx));
      const softbox=Math.exp(-(((rx+.36)/.18)**2)-(((reflectedY-.48)/.36)**2));
      const diffuse=Math.max(0,-nx*.3995+ny*.799-nz*.4494);
      const value=.00012+diffuse*.0008+(sky+horizon*.24+softbox*.055)*fresnel;
      projected[index+3]=255*(value*Math.exp(-distance*distance*.0015))**(1/2.2)*inv;
    };
    const triangle = (a,b,c) => {
      a*=4;b*=4;c*=4;
      const ax=projected[a],ay=projected[a+1],az=projected[a+2],ac=projected[a+3];
      const bx=projected[b],by=projected[b+1],bz=projected[b+2],bc=projected[b+3];
      const cx=projected[c],cy=projected[c+1],cz=projected[c+2],cc=projected[c+3];
      if (!az || !bz || !cz) return;
      const area=(bx-ax)*(cy-ay)-(by-ay)*(cx-ax);
      if (Math.abs(area)<.001) return;
      const x0=Math.max(0,Math.floor(Math.min(ax,bx,cx))), x1=Math.min(width-1,Math.ceil(Math.max(ax,bx,cx)));
      const y0=Math.max(0,Math.floor(Math.min(ay,by,cy))), y1=Math.min(height-1,Math.ceil(Math.max(ay,by,cy)));
      const adx=(by-cy)/area, bdx=(cy-ay)/area;
      for (let y=y0;y<=y1;y++) {
        let wa=((bx-x0-.5)*(cy-y-.5)-(by-y-.5)*(cx-x0-.5))/area;
        let wb=((cx-x0-.5)*(ay-y-.5)-(cy-y-.5)*(ax-x0-.5))/area;
        for (let x=x0;x<=x1;x++,wa+=adx,wb+=bdx) {
          const wc=1-wa-wb;
          if (wa<-.00001 || wb<-.00001 || wc<-.00001) continue;
          const d=wa*az+wb*bz+wc*cz, offset=y*width+x;
          if (d<=depth[offset]) continue;
          depth[offset]=d;
          const color=(wa*ac+wb*bc+wc*cc)/d, pixel=offset*4;
          pixels.data[pixel]=pixels.data[pixel+1]=pixels.data[pixel+2]=color;
        }
      }
    };
    const render = time => {
      pixels.data.fill(0); depth.fill(0);
      for (let i=3;i<pixels.data.length;i+=4) pixels.data[i]=255;
      for (let i=0;i<count;i++) shadeVertex(positions[i*2],positions[i*2+1],time,i*4);
      for (let row=0;row<rows;row++) {
        for (let col=0;col<columns;col++) {
          const a=row*(columns+1)+col,b=a+columns+1;
          triangle(a,b,a+1);triangle(a+1,b,b+1);
        }
      }
      ctx.putImageData(pixels,0,0);
    };
    const resize = () => {
      const w=Math.max(1,layer.clientWidth),h=Math.max(1,layer.clientHeight);
      const ratio=Math.min(1,640/w,480/h,Math.sqrt(180000/(w*h)));
      width=canvas.width=Math.max(1,Math.round(w*ratio));
      height=canvas.height=Math.max(1,Math.round(h*ratio));
      cameraX=w<=800 ? 4 : 0;
      pixels=ctx.createImageData(width,height);depth=new Float32Array(width*height);
    };
    resize();
    return {render,resize,destroy:()=>canvas.remove()};
  };
})();
