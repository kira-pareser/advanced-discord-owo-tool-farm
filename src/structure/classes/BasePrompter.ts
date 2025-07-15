import { checkbox, confirm, input, select, Separator } from "@inquirer/prompts";

type InquirerPrompt<TValue, TOptions> = (options: TOptions) => Promise<TValue>;

export abstract class BasePrompter {
    constructor() { }

    protected ask = <TValue, TOptions>(
        prompt: InquirerPrompt<TValue, TOptions>,
        options: TOptions,
        doc?: string
    ): Promise<TValue> => {
        console.clear();
        if (doc) console.log(doc);
        return prompt(options);
    }

    public trueFalse = (
        message: string,
        defaultValue: boolean = true
    ): Promise<boolean> =>
        this.ask(confirm, {
            message,
            default: defaultValue,
        });

    public getInput = (
        message: string,
        defaultValue?: string,
        validate?: (input: string) => boolean | string,
        documentation?: string
    ): Promise<string> =>
        this.ask(input, {
            message,
            default: defaultValue,
            validate,
        }, documentation);

    public getSelection = <T>(
        message: string,
        choices: Array<{ name: string; value: T; disabled?: boolean | string } | Separator>,
        defaultValue?: T,
        documentation?: string
    ): Promise<T> =>
        this.ask(select<T>, {
            message,
            choices,
            default: defaultValue,
        }, documentation);

    public getMultipleSelection = <T>(
        message: string,
        choices: Array<{ name: string; value: T; checked?: boolean }>,
        defaultValue?: T[],
        documentation?: string
    ): Promise<T[]> =>
        this.ask(checkbox<T>, {
            message,
            choices,
            default: defaultValue,
        }, documentation);
}