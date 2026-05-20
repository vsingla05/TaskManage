import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const COLUMNS = [
  { id: 'todo', title: 'To do' },
  { id: 'in-progress', title: 'In progress' },
  { id: 'done', title: 'Done' },
];

function taskIdStr(t) {
  return String(t._id);
}

export default function TaskKanban({ tasks, onStatusChange, canDragTask }) {
  function onDragEnd(result) {
    const { destination, draggableId, source } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }
    const newStatus = destination.droppableId;
    const task = tasks.find((x) => taskIdStr(x) === draggableId);
    if (!task || task.status === newStatus) return;
    onStatusChange(draggableId, newStatus);
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <Droppable key={col.id} droppableId={col.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex min-h-[240px] flex-col rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/50 ${
                    snapshot.isDraggingOver ? 'ring-2 ring-brand-400/40' : ''
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {col.title}
                    </h3>
                    <span className="text-xs text-slate-500">{colTasks.length}</span>
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    {colTasks.map((task, index) => (
                      <Draggable
                        key={taskIdStr(task)}
                        draggableId={taskIdStr(task)}
                        index={index}
                        isDragDisabled={!canDragTask(task)}
                      >
                        {(prov, snap) => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            {...prov.dragHandleProps}
                            className={`rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm dark:border-slate-700 dark:bg-slate-900 ${
                              snap.isDragging ? 'shadow-md ring-2 ring-brand-500/30' : ''
                            } ${!canDragTask(task) ? 'opacity-80' : ''}`}
                          >
                            <p className="font-medium text-slate-900 dark:text-white">{task.title}</p>
                            {task.description && (
                              <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">
                                {task.description}
                              </p>
                            )}
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                              <span>
                                Due {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                              </span>
                              {task.assignedTo?.name && (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                                  {task.assignedTo.name}
                                </span>
                              )}
                              {task.overdue && (
                                <span className="rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-800 dark:bg-red-900/60 dark:text-red-100">
                                  Overdue
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          );
        })}
      </div>
    </DragDropContext>
  );
}
