import * as React from "react";

export function Figure({
  children,
  caption,
}: {
  children: React.ReactNode;
  caption?: React.ReactNode;
}) {
  return (
    <figure className="my-6">
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {children}
      </div>
      {caption ? (
        <figcaption className="mt-2.5 text-center text-xs text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
