import { Node } from "@tiptap/pm/model";
import { Editor } from "@tiptap/core";
import { TablePlusOptions } from "./types";
export class TablePlusNodeView {
  node: Node;
  getPos: () => number | undefined;
  editor: Editor;
  dom: HTMLElement;
  contentDOM: HTMLElement;
  maxCellCount: number;
  cellPercentage: number[];
  columnSize: string;
  constructor(node: Node, getPos: () => number | undefined, editor: Editor, options: TablePlusOptions) {
    this.node = node;
    this.columnSize = node.attrs.columnSize;
    this.getPos = getPos;
    this.editor = editor;

    // Main wrapper div
    this.dom = document.createElement("div");
    this.dom.style.position = "relative";

    this.maxCellCount = 0;
    this.cellPercentage = [];

    this.updateNode(node);

    const slider = document.createElement("div");
    slider.style.width = "100%";
    slider.style.position = "relative";
    this.dom.appendChild(slider);

    let handles: HTMLElement[] = [];

    function dragHandle(handle: HTMLElement) {
      let startX;
      let handleIndex = parseInt(handle.dataset.index ?? "0");

      function onMouseMove(e: MouseEvent) {
        let rect = slider.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let percent = Math.min(Math.max((x / rect.width) * 100, 0), 100);

        // Prevent crossing other handles
        if (handleIndex > 0) {
          percent = Math.max(
            percent,
            parseFloat(handles[handleIndex - 1].style.left)
          );
        }
        if (handleIndex < handles.length - 1) {
          percent = Math.min(
            percent,
            parseFloat(handles[handleIndex + 1].style.left)
          );
        }

        handle.style.left = percent + "%";
        updateValues();
      }

      function onMouseUp() {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        updateValues(true);
      }

      handle.addEventListener("mousedown", (e) => {
        e.preventDefault();
        startX = e.clientX;
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      });
    }

    const updateValues = (updateNode: boolean = false) => {
      const values = handles.map(
        (h) => Math.round(parseFloat(h.style.left) * 100) / 100
      );
      let counted = 0;
      let _values = [];
      for (let i = 0; i < values.length; i++) {
        _values.push(Math.round((values[i] - counted) * 100) / 100);
        counted = values[i];
      }

      this.dom.style.setProperty("--cell-percentage", _values.map((a) => `${a}%`).join(" "));
      if (updateNode) {
        this.editor.commands.command(({ tr }) => {
          const pos = this.getPos();

          if (typeof pos !== "number") {
            return false;
          }

          tr.setNodeMarkup(pos, undefined, {
            ...this.node.attrs,
            columnSize: _values.map((a) => a.toString()).join(","),
          });

          return true;
        });
      }
    };

    let lastValue = 0;
    for (let index = 0; index < this.cellPercentage.length; index++) {
      lastValue = lastValue + this.cellPercentage[index];
      const handle = document.createElement("div");
      handle.className = "handle";
      handle.style.position = "absolute";
      handle.style.top = "50%";
      handle.style.width = "12px";
      handle.style.height = "12px";
      handle.style.zIndex = "9999";
      handle.style.borderRadius = "50%";
      handle.style.transform = "translate(-50%, -50%)";
      handle.style.cursor = "ew-resize";
      Object.assign(handle.style, {
        ...options.resizeHandleStyle,
      });
      handle.dataset.index = index.toString();
      handle.style.left = `${lastValue}%`;
      slider.appendChild(handle);
      handles.push(handle);
      dragHandle(handle);
    }

    
    // For child nodes
    this.contentDOM = document.createElement("table");
    this.contentDOM.classList.add("table-plus");
    this.contentDOM.style.flex = "1"; // allow child nodes to expand if needed
    this.dom.appendChild(this.contentDOM);
  }

  updateNode(node: Node) {
    this.columnSize = node.attrs.columnSize;
    node.forEach((child) => {
      if (child.type.name === "tableRowGroup") {
        child.forEach((row) => {
          if (row.type.name === "tableRow") {
            if (row.childCount > this.maxCellCount) {
              this.maxCellCount = row.childCount;
            }
          }
        });
      } else if (child.type.name === "tableRow") {
        if (child.childCount > this.maxCellCount) {
          this.maxCellCount = child.childCount;
        }
      }
    });

    function getColumnSizeList(columnSize: string) {
      const arr: string[] = columnSize.split(",").map((str) => str.trim());

      const numbers: number[] = arr.every(
        (item) => item !== "" && !isNaN(Number(item))
      )
        ? arr.map(Number)
        : [];
      return numbers;
    }

    this.dom.style.setProperty("--cell-count", this.maxCellCount.toString());

    this.cellPercentage = Array(this.maxCellCount).fill(
      Math.floor(100 / this.maxCellCount)
    );
    const columnSize = getColumnSizeList(this.columnSize);
    const totalColumnSize = columnSize.reduce(
      (acc: number, curr: number) => acc + curr,
      0
    );
    if (totalColumnSize <= 100 && totalColumnSize > 90) {
      this.cellPercentage = columnSize;
    }
    this.dom.style.setProperty(
      "--cell-percentage",
      this.cellPercentage.map((a) => `${a}%`).join(" ")
    );
  }

  // Required for Tiptap/ProseMirror to mount child nodes
  getContentDOM() {
    return this.contentDOM;
  }

  // Optionally, handle node updates if attributes change
  update(node: Node) {
    if (node.attrs.columnSize !== this.columnSize) {
      this.updateNode(node);
    }
    this.node = node;
    return true;
  }

  // Tiptap expects these properties
  ignoreMutation() {
    return true;
  }
}
