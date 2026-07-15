class SiteMenu extends HTMLElement {
    connectedCallback() {
        const links = [
            { href: "/", label: "Home" },
            { href: "/laundry.html", label: "Laundry" },
            { href: "/guinea-pigs.html", label: "Guinea pigs" },
            { href: "/hang-clothes.html", label: "Hang clothes" },
            { href: "/kaka-teeth.html", label: "Kaka's teeth" },
            { href: "/rules.html", label: "Rules" },
        ];
        const currentPath = window.location.pathname === "/index.html"
            ? "/"
            : window.location.pathname;
        const navigation = document.createElement("nav");

        navigation.className = "site-menu";
        navigation.setAttribute("aria-label", "Main menu");
        links.forEach(({ href, label }) => {
            const link = document.createElement("a");
            link.href = href;
            link.textContent = label;
            if (currentPath === href) link.setAttribute("aria-current", "page");
            navigation.append(link);
        });

        this.replaceChildren(navigation);
    }
}

customElements.define("site-menu", SiteMenu);
