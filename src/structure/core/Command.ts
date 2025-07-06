export class Command {
    public name: string;
    public description: string;
    public aliases: string[];
    public usage: string;
    public category: string;
    public enabled: boolean;
    public ownerOnly: boolean;

    constructor(name: string, description: string, aliases: string[] = [], usage: string = "", category: string = "General", enabled: boolean = true, ownerOnly: boolean = false) {
        this.name = name;
        this.description = description;
        this.aliases = aliases;
        this.usage = usage;
        this.category = category;
        this.enabled = enabled;
        this.ownerOnly = ownerOnly;
    }
}