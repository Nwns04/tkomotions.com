import * as runtime from 'react/jsx-runtime';

type MDXProps = { code: string; components?: Record<string, React.ComponentType> };

export function MDXContent({ code, components = {} }: MDXProps) {
  const CompiledContent = new Function(code)({ ...runtime }).default as React.ComponentType<{ components: Record<string, React.ComponentType> }>;
  return <CompiledContent components={components} />;
}