export const tabId = (prefix: string, id: string) => `${prefix}-tab-${id}`
export const panelId = (prefix: string, id: string) => `${prefix}-panel-${id}`

// Spread on the element that holds the selected tab's content.
export function tabPanelProps(prefix: string, id: string) {
  return { role: 'tabpanel', id: panelId(prefix, id), 'aria-labelledby': tabId(prefix, id), tabIndex: 0 } as const
}
