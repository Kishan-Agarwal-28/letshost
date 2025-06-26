import { FaGithub, FaLinkedin } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
function Footer() {
  const navigate = useNavigate();
  return (
    <div className="w-full bg-background py-10 px-4 sm:px-8 flex items-center justify-center">
      <div className="w-full max-w-screen-xl bg-zinc-800 rounded-3xl flex flex-col md:flex-row items-start justify-between p-6 gap-6">
        {/* Left Section */}
        <div className="w-full md:w-2/3 border-b-2 md:border-b-0 md:border-r-2 border-zinc-700 flex flex-col justify-between h-full gap-4 md:pr-6">
          <h1
            className="font-extrabold text-3xl md:text-4xl cursor-pointer"
            onClick={() => navigate("/")}
          >
            Letshost
          </h1>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-6">
            <span className="text-sm text-muted-foreground flex flex-col">
              Brought to you by Kishan Agarwal
           
            <Link to={"/terms"} className="text-sm text-primary">
              Terms of Service
            </Link>
             </span>
            <div className="flex items-center gap-4 text-sm">
              <a
                href="https://github.com/kishan-agarwal-28"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 hover:underline"
              >
                <FaGithub />
                Github
              </a>
              <a
                href="https://www.linkedin.com/in/kishan-agarwal-28"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 hover:underline"
              >
                <FaLinkedin />
                Linkedin
              </a>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="w-full md:w-1/3 flex flex-col gap-4 mt-6 md:mt-0">
          <span className="text-muted-foreground underline text-sm px-2">
            Links
          </span>
          <div className="flex flex-col sm:flex-row justify-around gap-4">
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/tools">Tools</Link>
              </li>
            </ul>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>
                <Link to="/pricing">Pricing</Link>
              </li>
              <li>
                <Link to="/contact-us">Contact Us</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Footer;
