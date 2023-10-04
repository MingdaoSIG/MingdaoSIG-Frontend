"use client";
const SearchBar = () => {
  return (
    <>
      <div className="search w-[80%]">
        <input
          className="w-full bg-slate-400 outline-none text-slate-900 placeholder:text-slate-700 p-4 rounded-md"
          type="text"
          name="search"
          id="search"
          placeholder="Search anything.."
        />
      </div>
    </>
  );
};

export default SearchBar;
