import TiptapTable from '@tiptap/extension-table'
import duplicateColumn from './commands/duplicateColumn';
import duplicateRow from './commands/duplicateRow';
import { EditorState, Transaction } from '@tiptap/pm/state';

export const TablePlus = TiptapTable.extend({
    addCommands() {
        return {
            ...this.parent?.(),
            duplicateColumn: (withContent = true) => ({ state, dispatch }: { state: EditorState, dispatch: (tr: Transaction) => void }) => {
                duplicateColumn(state, dispatch, withContent)
                return true;
            },
            duplicateRow: (withContent = true) => ({ state, dispatch }: { state: EditorState, dispatch: (tr: Transaction) => void }) => {
                duplicateRow(state, dispatch, withContent)
                return true;
            },
        }
    }
})

export default TablePlus
