import katex from "katex";
import { cn } from "@/lib/utils";

export function Math({
  children,
  display = false,
  className,
}: {
  children: string;
  display?: boolean;
  className?: string;
}) {
  const html = katex.renderToString(children, {
    displayMode: display,
    throwOnError: false,
    output: "html",
  });
  return (
    <span
      className={cn(
        display ? "my-5 block overflow-x-auto py-1 text-center" : "inline",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function M({ children }: { children: string }) {
  return <Math>{children}</Math>;
}
export function MB({ children }: { children: string }) {
  return <Math display>{children}</Math>;
}
