const Footer = ()=> {
    return (
        <footer className="border-t border-[#e5e7eb] bg-[#ffffff]">
            <div className="max-w-[1100px] mx-auto px-[16px] py-[16px] flex flex-col sm:flex-row items-center justify-between gap-[10px]">
                <p className="text-[13px] text-[#475569]">© {new Date().getFullYear()} LearnHub</p>
                <div className="flex items-center gap-[12px]">
                <a href="https://github.com/" target="_blank" rel="noreferrer" className="hover:opacity-80">
                    <img alt="GitHub" className="w-[20px] h-[20px]" src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/github.svg" />
                </a>
                <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer" className="hover:opacity-80">
                    <img alt="LinkedIn" className="w-[20px] h-[20px]" src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/linkedin.svg" />
                </a>
                <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" className="hover:opacity-80">
                    <img alt="Instagram" className="w-[20px] h-[20px]" src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg" />
                </a>
                </div>
            </div>
        </footer>
    )
}   

export default Footer;