import type { MDXComponents } from "mdx/types";

const components: MDXComponents = {
  h2: ({ children }) => (
    <h2 className="mt-8 text-lg font-semibold text-white first:mt-0">
      {children}
    </h2>
  ),
  ul: ({ children }) => (
    <ul className="mt-3 space-y-1.5 text-white/70">{children}</ul>
  ),
  li: ({ children }) => (
    <li className="flex gap-2 before:text-white/30 before:content-['-']">
      {children}
    </li>
  ),
  p: ({ children }) => <p className="mt-3 text-white/70">{children}</p>,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
