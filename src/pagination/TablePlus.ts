import Table from "@tiptap/extension-table";
import { mergeAttributes } from "@tiptap/core";
import { DOMOutputSpec } from "@tiptap/pm/model";
import { TableRowGroup } from "./TableRowGroup";
import { TableCommandExtension } from "../TableCommandExtension";
import { TablePlusNodeView } from "./TablePlusNodeView";
import { TablePlusOptions } from "./types";

export const TablePlus = Table.extend<TablePlusOptions>({
  content: "(tableRowGroup|tableRow)+",
  addOptions() {
    return {
      ...this.parent?.(),
      resizeHandleStyle: {
        background: "#353535",
      },
    };
  },
  addExtensions() {
    return [
      TableRowGroup,
      TableCommandExtension,
    ]
  },
  addAttributes() {
    return {
      ...this.parent?.(),
      columnSize: {
        default: '',
        parseHTML: (element) => {
          let columnSize = element.getAttribute('data-column-size') || '';
          let columnSizeList = columnSize.split(',');
          const isAllNumber = columnSizeList.every((a: string) => !isNaN(Number(a)));
          if(!isAllNumber) {
            columnSizeList = [];
          }
          return columnSizeList.join(',');
        },
        renderHTML: (attributes) => {
          return {
            'data-column-size': attributes.columnSize,
          };
        },
      },
    }
  },
  renderHTML({ node, HTMLAttributes }) {
    const table: DOMOutputSpec = [
      "table",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        border: 1,
      }),
      0,
    ];
    return table;
  },
  addNodeView() {
    return ({ node, getPos, editor }) => new TablePlusNodeView(node, getPos, editor, this.options)
  },
});

export default TablePlus;
