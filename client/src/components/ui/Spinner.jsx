export default function Spinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-[9999]">
      <div className="w-[48px] h-[48px] border-[5px] border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
