import React, { Suspense, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, OrbitControls, useGLTF, Html } from "@react-three/drei";
import { Box3, Vector3, Group, PerspectiveCamera } from "three";

type ModelCanvasProps = {
  src: string; // public path to .glb/.gltf
  scale?: number; // additional scale factor on top of fitted size
  autoRotate?: boolean; // default false per requirements
  className?: string; // extra classes for outer container
  fitMargin?: number; // margin for Bounds fit to avoid clipping
  enableZoom?: boolean;
  enableRotate?: boolean;
  enablePan?: boolean;
  viewMargin?: number; // extra margin when fitting to the viewport (>=1 is looser, <1 tighter)
  offsetYRatio?: number; // shift model down (+) or up (-) by this fraction of its height after centering
};

const FittedModel = React.forwardRef<Group, { src: string; fit?: number; scale?: number; offsetYRatio?: number }>(({ src, fit = 1.0, scale = 1.0, offsetYRatio = 0 }, ref) => {
  const gltf = useGLTF(src);
  const model = React.useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const groupRef = React.useRef<Group>(null);

  React.useLayoutEffect(() => {
    if (!groupRef.current) return;
    // Center model at origin by offsetting by its bounding box center
    const box = new Box3().setFromObject(model);
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);
    model.position.sub(center); // recenter to origin

    // Compute uniform scale so the largest dimension equals `fit`
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const uniform = (fit / maxDim) * scale;
    groupRef.current.scale.setScalar(uniform);

    // Apply vertical offset based on fitted height so we can nudge the model downwards into visual center
    const fittedHeight = size.y * uniform;
    groupRef.current.position.y = groupRef.current.position.y - fittedHeight * offsetYRatio;
  }, [model, fit, scale]);

  const setRefs = (node: Group | null) => {
    (groupRef as React.MutableRefObject<Group | null>).current = node;
    if (typeof ref === "function") ref(node);
    else if (ref && "current" in (ref as any)) (ref as React.MutableRefObject<Group | null>).current = node;
  };

  return <group ref={setRefs}><primitive object={model} /></group>;
});
FittedModel.displayName = "FittedModel";

function FitCamera({ targetRef, margin = 1.0 }: { targetRef: React.RefObject<Group>; margin?: number }) {
  const { camera, size } = useThree();
  React.useLayoutEffect(() => {
    const obj = targetRef.current;
    if (!obj) return;
    const box = new Box3().setFromObject(obj);
    const bSize = new Vector3();
    box.getSize(bSize);
    const aspect = Math.max(size.width / Math.max(size.height, 1), 0.0001);
    const persp = camera as PerspectiveCamera;
    const fov = (persp.fov * Math.PI) / 180;
    const halfHeight = (bSize.y * margin) / 2;
    const halfWidth = (bSize.x * margin) / 2;
    const distHeight = halfHeight / Math.tan(fov / 2);
    const distWidth = (halfWidth / Math.tan(fov / 2)) / aspect;
    const dist = Math.max(distHeight, distWidth, 0.1);
    persp.position.set(0, 0, dist);
    persp.near = Math.max(dist / 100, 0.01);
    persp.far = dist * 100;
    persp.updateProjectionMatrix();
    persp.lookAt(0, 0, 0);
  }, [targetRef, camera, size.width, size.height, margin]);
  return null;
}

useGLTF.preload("/models/base_basic_pbr.glb");

export const ModelCanvas: React.FC<ModelCanvasProps> = ({
  src,
  scale = 1.14,
  autoRotate = false,
  className = "",
  fitMargin = 1.0,
  enableZoom = true,
  enableRotate = true,
  enablePan = false,
  viewMargin = 0.96,
  offsetYRatio = 0.18,
}) => {
  // Maintain a circular mask using Tailwind utility classes. The Canvas fills the container.
  const containerClasses = useMemo(
    () => `relative rounded-full overflow-hidden ${className}`,
    [className]
  );
  const contentRef = React.useRef<Group>(null);

  return (
    <div className={containerClasses}>
      <Canvas camera={{ position: [0, 0, 2.4], fov: 45 }} dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 2, 2]} intensity={0.9} />
        <directionalLight position={[-2, -1, 2]} intensity={0.4} />

        <Suspense fallback={<Html center><div className="text-white text-xs opacity-80">Loading…</div></Html>}>
          {/* Manually center and fit model into a unit space, apply Y offset, then fit camera to viewport */}
          <FittedModel ref={contentRef} src={src} fit={fitMargin} scale={scale} offsetYRatio={offsetYRatio} />
          <FitCamera targetRef={contentRef} margin={viewMargin} />
          <Environment preset="city" />
        </Suspense>

        <OrbitControls makeDefault
          target={[0, 0, 0]}
          enablePan={enablePan}
          enableZoom={enableZoom}
          enableRotate={enableRotate}
          autoRotate={autoRotate}
          minDistance={1.2}
          maxDistance={4.0}
        />
      </Canvas>
    </div>
  );
};

export default ModelCanvas;
