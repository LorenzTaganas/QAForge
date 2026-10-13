import React from 'react'
import KanbanColumn from './KanbanColumn'

const KanbanBoard = ({ columns }) => {
  return (
    <div className="flex h-full gap-4 overflow-x-auto pb-4 custom-scrollbar">
      {columns.map((column) => (
        <KanbanColumn key={column.name} column={column} />
      ))}
    </div>
  )
}

export default KanbanBoard
