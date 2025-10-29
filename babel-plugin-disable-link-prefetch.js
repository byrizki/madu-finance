/**
 * Babel plugin to automatically add prefetch={false} to Next.js Link components
 * This prevents automatic prefetching of linked pages
 */
module.exports = function ({ types: t }) {
  return {
    name: 'disable-link-prefetch',
    visitor: {
      Program(path, state) {
        // Track Link component identifiers from next/link imports
        state.linkIdentifiers = new Set();
      },
      ImportDeclaration(path, state) {
        // Check if this is importing from 'next/link'
        if (path.node.source.value === 'next/link') {
          path.node.specifiers.forEach((specifier) => {
            if (t.isImportDefaultSpecifier(specifier) || t.isImportSpecifier(specifier)) {
              state.linkIdentifiers.add(specifier.local.name);
            }
          });
        }
      },
      JSXElement(path, state) {
        const openingElement = path.node.openingElement;
        const elementName = openingElement.name;

        // Check if this is a Link component
        let isLinkComponent = false;

        if (t.isJSXIdentifier(elementName)) {
          // Check if the element name matches any imported Link identifier
          isLinkComponent = state.linkIdentifiers.has(elementName.name);
        }

        if (!isLinkComponent) {
          return;
        }

        // Check if prefetch prop already exists
        const hasPrefetchProp = openingElement.attributes.some(
          (attr) =>
            t.isJSXAttribute(attr) &&
            t.isJSXIdentifier(attr.name) &&
            attr.name.name === 'prefetch'
        );

        // Only add prefetch={false} if it doesn't already exist
        if (!hasPrefetchProp) {
          const prefetchAttr = t.jsxAttribute(
            t.jsxIdentifier('prefetch'),
            t.jsxExpressionContainer(t.booleanLiteral(false))
          );
          openingElement.attributes.push(prefetchAttr);
        }
      },
    },
  };
};
