import { Brain } from 'lucide-react';

export default function EmptyState({ title = 'Nothing here yet', description = 'Get started by adding your first note.', action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="bg-primary-50 rounded-full p-5 mb-4">
        <Brain className="w-10 h-10 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-sm mb-6">{description}</p>
      {action && action}
    </div>
  );
}
