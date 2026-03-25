const Footer = () => {
  return (
    <footer className="py-12 border-t border-border bg-background">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <p className="font-display text-xl text-foreground mb-1">Brand</p>
            <p className="text-sm text-muted-foreground">
              Building remarkable things, one step at a time.
            </p>
          </div>
          
          <div className="flex gap-8 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">
              About
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Contact
            </a>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© 2025 Brand. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
