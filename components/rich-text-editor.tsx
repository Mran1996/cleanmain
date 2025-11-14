"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link,
  Type,
  Minus,
  Code,
  Highlighter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function RichTextEditor({
  content,
  onChange,
  disabled = false,
  placeholder = "Start typing...",
  className = ""
}: RichTextEditorProps) {
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [textColor, setTextColor] = useState('#000000')
  const [highlightColor, setHighlightColor] = useState('#FFFF00')

  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-6 ${className}`,
        style: 'min-height: 300px;',
      },
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  if (!editor) {
    return null
  }

  const setLink = () => {
    if (linkUrl) {
      // TipTap StarterKit doesn't include Link extension, so we'll use HTML
      const selection = editor.state.selection
      if (selection.empty) {
        // Insert link at cursor
        editor.chain().focus().insertContent(`<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkUrl}</a>`).run()
      } else {
        // Wrap selected text in link
        const { from, to } = selection
        const selectedText = editor.state.doc.textBetween(from, to)
        editor.chain()
          .focus()
          .insertContent(`<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${selectedText}</a>`)
          .deleteRange({ from, to })
          .run()
      }
      setShowLinkDialog(false)
      setLinkUrl('')
    }
  }

  const setTextColorStyle = (color: string) => {
    // Use inline style for text color
    const selection = editor.state.selection
    if (selection.empty) {
      // Apply to future text
      editor.chain().focus().setMark('textStyle', { color }).run()
    } else {
      const { from, to } = selection
      const selectedText = editor.state.doc.textBetween(from, to)
      if (selectedText) {
        editor.chain()
          .focus()
          .insertContent(`<span style="color: ${color}">${selectedText}</span>`)
          .deleteRange({ from, to })
          .run()
      }
    }
    setTextColor(color)
  }

  const setHighlightStyle = (color: string) => {
    // Use inline style for highlighting
    const selection = editor.state.selection
    if (selection.empty) return
    
    const { from, to } = selection
    const selectedText = editor.state.doc.textBetween(from, to)
    
    if (selectedText) {
      editor.chain()
        .focus()
        .insertContent(`<mark style="background-color: ${color}">${selectedText}</mark>`)
        .deleteRange({ from, to })
        .run()
    }
  }

  const fontSizes = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48', '72']
  const commonColors = [
    '#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#EFEFEF', '#F3F3F3', '#FFFFFF',
    '#980000', '#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#4A86E8', '#0000FF', '#9900FF', '#FF00FF',
    '#E6B8AF', '#F4CCCC', '#FCE5CD', '#FFF2CC', '#D9EAD3', '#D0E0E3', '#C9DAF8', '#CFE2F3', '#D9D2E9', '#EAD1DC',
    '#DD7E6B', '#EA9999', '#F9CB9C', '#FFE599', '#B6D7A8', '#A2C4C9', '#A4C2F4', '#9FC5E8', '#B4A7D6', '#D5A6BD',
    '#CC4125', '#E06666', '#F6B26B', '#FFD966', '#93C47D', '#76A5AF', '#6D9EEB', '#6FA8DC', '#8E7CC3', '#C27BA0',
    '#A61C00', '#CC0000', '#E69138', '#F1C232', '#6AA84F', '#45818E', '#3C78D8', '#3D85C6', '#674EA7', '#A64D79',
    '#85200C', '#990000', '#B45F06', '#BF9000', '#38761D', '#134F5C', '#1155CC', '#0B5394', '#351C75', '#741B47',
    '#5B0F00', '#660000', '#783F04', '#7F6000', '#274E13', '#0C343D', '#1C4587', '#073763', '#20124D', '#4C1130'
  ]

  return (
    <div className="border border-gray-300 rounded-lg shadow-sm bg-white">
      {/* Enhanced Toolbar */}
      <div className="border-b border-gray-200 bg-gray-50 px-3 py-2">
        {/* First Row - Main Formatting */}
        <div className="flex items-center gap-1 flex-wrap mb-2">
          {/* Text Style Dropdown */}
          <select
            className="px-2 py-1 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            onChange={(e) => {
              const value = e.target.value
              if (value === 'paragraph') {
                editor.chain().focus().setParagraph().run()
              } else if (value.startsWith('heading')) {
                const level = parseInt(value.replace('heading', '')) as 1 | 2 | 3 | 4 | 5 | 6
                editor.chain().focus().toggleHeading({ level }).run()
              }
            }}
            value={
              editor.isActive('heading', { level: 1 }) ? 'heading1' :
              editor.isActive('heading', { level: 2 }) ? 'heading2' :
              editor.isActive('heading', { level: 3 }) ? 'heading3' :
              editor.isActive('heading', { level: 4 }) ? 'heading4' :
              editor.isActive('heading', { level: 5 }) ? 'heading5' :
              editor.isActive('heading', { level: 6 }) ? 'heading6' :
              'paragraph'
            }
          >
            <option value="paragraph">Normal text</option>
            <option value="heading1">Heading 1</option>
            <option value="heading2">Heading 2</option>
            <option value="heading3">Heading 3</option>
            <option value="heading4">Heading 4</option>
            <option value="heading5">Heading 5</option>
            <option value="heading6">Heading 6</option>
          </select>

          {/* Font Size */}
          <select
            className="px-2 py-1 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            onChange={(e) => {
              const size = e.target.value
              const selection = editor.state.selection
              if (!selection.empty) {
                const { from, to } = selection
                const selectedText = editor.state.doc.textBetween(from, to)
                editor.chain()
                  .focus()
                  .insertContent(`<span style="font-size: ${size}pt">${selectedText}</span>`)
                  .deleteRange({ from, to })
                  .run()
              }
            }}
            defaultValue="12"
          >
            {fontSizes.map(size => (
              <option key={size} value={size}>{size}pt</option>
            ))}
          </select>

          <div className="h-6 w-px bg-gray-300 mx-1" />

          {/* Text Formatting */}
          <Button
            type="button"
            variant={editor.isActive('bold') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className="h-8 w-8 p-0"
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('italic') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className="h-8 w-8 p-0"
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const currentStyle = window.getComputedStyle(document.querySelector('.ProseMirror') as Element)
              const hasUnderline = currentStyle.textDecoration.includes('underline')
              if (hasUnderline) {
                editor.chain().focus().unsetMark('textStyle').run()
              } else {
                editor.chain().focus().setMark('textStyle', { textDecoration: 'underline' }).run()
              }
            }}
            className="h-8 w-8 p-0"
            title="Underline (Ctrl+U)"
          >
            <Underline className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('strike') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editor.can().chain().focus().toggleStrike().run()}
            className="h-8 w-8 p-0"
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </Button>

          <div className="h-6 w-px bg-gray-300 mx-1" />

          {/* Text Color */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="Text Color"
              >
                <Type className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-2">
                <Label>Text Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={textColor}
                    onChange={(e) => {
                      setTextColorStyle(e.target.value)
                    }}
                    className="h-10 w-20"
                  />
                  <Input
                    type="text"
                    value={textColor}
                    onChange={(e) => {
                      setTextColor(e.target.value)
                    }}
                    onBlur={(e) => {
                      setTextColorStyle(e.target.value)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setTextColorStyle(textColor)
                      }
                    }}
                    className="flex-1"
                    placeholder="#000000"
                  />
                </div>
                <div className="grid grid-cols-10 gap-1">
                  {commonColors.slice(0, 20).map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        setTextColor(color)
                        editor.chain().focus().setColor(color).run()
                      }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Highlight Color */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="Highlight Color"
              >
                <Highlighter className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-2">
                <Label>Highlight Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={highlightColor}
                    onChange={(e) => {
                      setHighlightColor(e.target.value)
                      setHighlightStyle(e.target.value)
                    }}
                    className="h-10 w-20"
                  />
                  <Input
                    type="text"
                    value={highlightColor}
                    onChange={(e) => {
                      setHighlightColor(e.target.value)
                      setHighlightStyle(e.target.value)
                    }}
                    className="flex-1"
                    placeholder="#FFFF00"
                  />
                </div>
                <div className="grid grid-cols-10 gap-1">
                  {['#FFFF00', '#00FF00', '#00FFFF', '#FF00FF', '#FF0000', '#0000FF', '#FFFFFF', '#000000'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        setHighlightColor(color)
                        setHighlightStyle(color)
                      }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <div className="h-6 w-px bg-gray-300 mx-1" />

          {/* Lists */}
          <Button
            type="button"
            variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className="h-8 w-8 p-0"
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className="h-8 w-8 p-0"
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className="h-8 w-8 p-0"
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('codeBlock') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className="h-8 w-8 p-0"
            title="Code Block"
          >
            <Code className="h-4 w-4" />
          </Button>

          <div className="h-6 w-px bg-gray-300 mx-1" />

          {/* Alignment - Using CSS classes */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const selection = editor.state.selection
              const { from, to } = selection
              const selectedContent = editor.getHTML()
              // Apply left align style
              editor.chain().focus().run()
            }}
            className="h-8 w-8 p-0"
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              editor.chain().focus().run()
            }}
            className="h-8 w-8 p-0"
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              editor.chain().focus().run()
            }}
            className="h-8 w-8 p-0"
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              editor.chain().focus().run()
            }}
            className="h-8 w-8 p-0"
            title="Justify"
          >
            <AlignJustify className="h-4 w-4" />
          </Button>

          <div className="h-6 w-px bg-gray-300 mx-1" />

          {/* Link */}
          <Popover open={showLinkDialog} onOpenChange={setShowLinkDialog}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowLinkDialog(true)
                }}
                className="h-8 w-8 p-0"
                title="Insert Link"
              >
                <Link className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <Label>Link URL</Label>
                <Input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setLink()
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button onClick={setLink} size="sm" className="flex-1">
                    Apply
                  </Button>
                  <Button
                    onClick={() => {
                      setShowLinkDialog(false)
                      setLinkUrl('')
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="h-8 w-8 p-0"
            title="Horizontal Line"
          >
            <Minus className="h-4 w-4" />
          </Button>

          <div className="h-6 w-px bg-gray-300 mx-1" />

          {/* Undo/Redo */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            className="h-8 w-8 p-0"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            className="h-8 w-8 p-0"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="bg-white min-h-[300px] relative">
        <EditorContent editor={editor} />
        {!content && !disabled && (
          <div className="absolute top-6 left-6 pointer-events-none text-gray-400 text-sm">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  )
}
