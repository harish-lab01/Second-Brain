export default function TagChip({ tag, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
        active
          ? 'bg-primary text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-primary-100 hover:text-primary'
      }`}
    >
      {tag}
    </button>
  );
}
