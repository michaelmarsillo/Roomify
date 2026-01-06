
export default function Footer() {
  return (
    <footer className="flex items-center justify-center py-4 bg-black/20 text-gray-400 mt-20">
      <p className="text-sm text-center">
        Made with <span className="text-red-500">💖</span> by 
        <a href="https://github.com/michaelmarsillo" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline ml-1 mr-1">
          Michael Marsillo
        </a> 
         &copy; {new Date().getFullYear()} all rights reserved.
      </p>
    </footer>
  );
}
