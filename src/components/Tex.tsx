import katex from 'katex'
import { useMemo } from 'react'

type Props = {
  tex: string
  display?: boolean
}

export default function Tex({ tex, display = false }: Props) {
  const html = useMemo(
    () =>
      katex.renderToString(tex, {
        throwOnError: false,
        displayMode: display,
        strict: false,
      }),
    [tex, display]
  )

  return (
    <span
      style={{ display: display ? 'block' : 'inline' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
