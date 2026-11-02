"use client";
import { useState } from "react";
import Image, { type ImageProps } from "next/image";
/** Optimize supported marketplace imagery; unknown user avatar hosts load directly. */
export function RemoteImage({alt="",width=400,height=300,unoptimized,onError,...props}:Omit<ImageProps,"alt"|"width"|"height"> & {alt?:string;width?:number;height?:number}) {
  const [failedSource,setFailedSource] = useState<ImageProps["src"] | null>(null);
  const failed = failedSource === props.src;
  const trusted = typeof props.src === "string" && props.src.startsWith("https://images.unsplash.com/");
  return <Image {...props} src={failed ? "/image-placeholder.svg" : props.src} alt={failed && alt ? "Image unavailable" : alt} width={width} height={height} unoptimized={failed || unoptimized || !trusted} onError={event=>{setFailedSource(props.src);onError?.(event);}}/>;
}
