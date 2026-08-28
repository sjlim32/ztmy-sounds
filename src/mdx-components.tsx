import type { MDXComponents } from "mdx/types";
import { cn } from "@/lib/utils";
import { SiteLink } from "@/components/SiteLink";

const components: MDXComponents = {
  a: ({ className, children, href, ...props }) => (
    <SiteLink href={href} className={className} {...props}>
      {children}
    </SiteLink>
  ),
  h2: ({ className, children, ...props }) => (
    <h2
      className={cn(
        "mt-8 text-lg font-semibold text-white first:mt-0",
        className,
      )}
      {...props}
    >
      {children}
    </h2>
  ),
  ul: ({ className, children, ...props }) => (
    <ul className={cn("mt-3 space-y-1.5 text-white", className)} {...props}>
      {children}
    </ul>
  ),
  li: ({ className, children, ...props }) => (
    <li
      className={cn(
        "flex gap-2 before:text-white/30 before:content-['-']",
        className,
      )}
      {...props}
    >
      {children}
    </li>
  ),
  p: ({ className, children, ...props }) => (
    <p className={cn("mt-3 text-white", className)} {...props}>
      {children}
    </p>
  ),
};

export function useMDXComponents(): MDXComponents {
  return components;
}
