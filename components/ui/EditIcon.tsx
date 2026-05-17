/* eslint-disable @next/next/no-img-element */
import React from "react";

export default function EditIcon({
  className = "",
  width = 16,
  height = 16,
}: {
  className?: string;
  width?: number;
  height?: number;
}) {
  return (
    <img
      src="/images/EditPencil_Icon.svg"
      alt="Edit"
      width={width}
      height={height}
      className={className}
      draggable={false}
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        filter: "brightness(0) invert(1)",
      }}
    />
  );
}
