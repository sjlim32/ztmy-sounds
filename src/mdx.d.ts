declare module "*.mdx" {
  import type { ReactElement } from "react";
  const MDXComponent: (props: unknown) => ReactElement;
  export default MDXComponent;
}
