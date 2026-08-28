/**
 * `@easyops-cn/docusaurus-search-local` ships theme components but no types,
 * so declare the one we wrap in `src/theme/SearchPage`.
 */
declare module '@theme-original/SearchPage' {
  import type {ComponentType} from 'react';

  const SearchPage: ComponentType<Record<string, unknown>>;
  export default SearchPage;
}
