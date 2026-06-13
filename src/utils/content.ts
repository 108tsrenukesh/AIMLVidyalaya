import manifest from './content-manifest.json'

export interface ContentItem {
  name: string
  path: string
  type: 'folder' | 'file'
  children?: ContentItem[]
}

export async function getContentLibrary(): Promise<ContentItem[]> {
  return manifest.topics as ContentItem[]
}

export function getTopicDescription(topic: string): string {
  const meta = (manifest.topicMeta as Record<string, { description: string }>)[topic]
  return meta?.description || ''
}

export function getTopicLabel(topic: string): string {
  const meta = (manifest.topicMeta as Record<string, { label: string }>)[topic]
  return meta?.label || topic
}
