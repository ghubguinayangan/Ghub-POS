import Image from "next/image";

const Logo = ({ className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
  <div className={`flex items-center gap-2 ${className || ""}`}>
    <Image
      src="/ghublogo.jpg"
      alt="G-hub POS Logo"
      width={40}
      height={40}
      className="rounded-lg object-contain"
      priority
    />
    <span className="text-xl font-bold tracking-tight text-foreground">
      G-hub <span className="text-primary">POS</span>
    </span>
  </div>
);

export default Logo;
