const box_width: number = 40;
const radius: number = 20;


class NodeStorage {
    private counter: number = 0;
    private storage: Map<number, DrawableNode> = new Map();
    public root : Term | null = null ;

    private static instance: NodeStorage = new NodeStorage();
    private constructor() { }
    static getInstance(): NodeStorage {
        return this.instance;
    }
    public getCouner(): number {
        this.counter += 1;
        return this.counter;
    }
    public resetStorage(): void {
        this.counter = 0;
        this.storage.clear();
    }

    public insertNode(node: DrawableNode): void {
        this.storage.set(node.nodeid, node);
    }

    public getNode(nodeid: number): DrawableNode | undefined {
        return this.storage.get(nodeid) ?? undefined;
    }

}
class DrawableNode {

    nodeid: number = -1;

    left?: DrawableNode | null;
    right?: DrawableNode | null;

    coord_x: number = 0;
    coord_y: number = 0;
    left_width: number = 0;
    right_width: number = 0;
    height: number = 0;

    protected getText() { return "xx"; }
    protected getColor() { return "white"; }
    protected isClickable(): boolean { return false; }

    public setCoordinates(x: number, y: number) {
        this.coord_x = x;
        this.coord_y = y;
    }


    private measureTree(): void {
        this.nodeid = NodeStorage.getInstance().getCouner();
        this.left_width = 0;
        this.right_width = 0;
        this.height = box_width;
        let left_height: number = 0;
        let right_height: number = 0;

        if (this.left) {
            this.left.measureTree();
            this.left_width = this.left.left_width + box_width + this.left.right_width;
            left_height = this.left.height;
        }
        if (this.right) {
            this.right.measureTree();
            this.right_width = this.right.left_width + box_width + this.right.right_width;
            right_height = this.right.height;
        }
        this.height += left_height > right_height ? left_height : right_height;
    }


    private getSVGContents(): string {
        let innerHTML: string = "";
        let leftinnerHTML: string = "";
        let rightinnerHTML: string = "";

        if (this.left) {
            this.left.setCoordinates(
                this.coord_x - box_width - this.left.right_width,
                this.coord_y + box_width
            );
            innerHTML += `<line x1= "${this.coord_x}" y1 = "${this.coord_y}" x2 = "${this.left.coord_x}" y2 = "${this.left.coord_y}" style="stroke:black;stroke-width:1" />`
            leftinnerHTML = this.left.getSVGContents();
        }
        if (this.right) {
            this.right.setCoordinates(
                this.coord_x + box_width + this.right.left_width,
                this.coord_y + box_width
            );
            innerHTML += `<line x1= "${this.coord_x}" y1 = "${this.coord_y}" x2 = "${this.right.coord_x}" y2 = "${this.right.coord_y}" style="stroke:black;stroke-width:1" />`
            rightinnerHTML = this.right.getSVGContents();
        }

        if (this.isClickable()) {
            NodeStorage.getInstance().insertNode(this);
            innerHTML += `<circle cx="${this.coord_x}" cy="${this.coord_y}" r="${radius}" stroke="black" 
            fill="${this.getColor()}" onClick="onClickRedex(${this.nodeid})" />`;
        } else {
            innerHTML += `<circle cx="${this.coord_x}" cy="${this.coord_y}" r="${radius}" stroke="black" 
            fill="${this.getColor()}" />`;
        }


        innerHTML += `<text text-anchor="middle" x= "${this.coord_x}" y= "${this.coord_y}">${this.getText()}</text>`;
        innerHTML += leftinnerHTML;
        innerHTML += rightinnerHTML;
        return innerHTML;
    }


    public getSVGInnerHTML(): string {
        NodeStorage.getInstance().resetStorage();
        this.measureTree();
        let innerHTML: string = `<svg xmlns="http://www.w3.org/2000/svg" height="${this.height + 20}"  width = ${box_width + this.left_width + this.right_width + 20} version="1.1">`;

        this.setCoordinates(
            this.left_width + box_width / 2 + 10,
            box_width / 2 + 10
        )
        innerHTML += this.getSVGContents() + "</svg>"
        return innerHTML;
    }
}



class Term extends DrawableNode {
    type: string = "udf";
    name?: string | null;
    left?: Term | null;
    right?: Term | null;
    index?: number;

    static indexFreeVariable(x:Term){

    }

    constructor(type: string, name?: string | null, left?: Term | null, right?: Term | null) {
        super();
        this.type = type;
        this.name = name;
        this.left = left;
        this.right = right;
    }

    private isRedex(): boolean {
        if (this.type === "app" && this.left && this.left.type === "func") {
            return true;
        }
        return false;
    }
    public getText(): string {
        if (this.type === "var") {
            return ` ${this.name ?? ""}_${this.index ?? -1} `;
        } else {
            return this.type;
        }
    }

    public getColor(): string {
        if (this.isRedex()) {
            return "pink";
        }
        return "white";
    }

    public isClickable(): boolean {
        if (this.isRedex()) {
            return true;
        }
        return false;
    }

    public toString(): string {
        if (this.type === "var") {
            return this.name ?? "";
        } else if (this.type === "func") {
            return this.left?.toString() + "=>" + this.right?.toString();
        } else if (this.type === "app") {
            return "(" + this.left?.toString() + ")(" + this.right?.toString() + ")";
        }
        return "";
    }

    public duplicate(): Term | null {
        let copy = new Term(this.type, this.name, undefined, undefined);
        if (this.left) {
            copy.left = this.left.duplicate();
        }
        if (this.right) {
            copy.right = this.right.duplicate();
        }
        copy.index = -1;
        return copy;
    }



    static parseExpression(input: string): Term | null {
        if (!input) {
            return null;
        }
        let node: Term | null = null;
        if (input[0] === '(') {
            node = new Term("app");
            let counter: number = 1;
            for (let i: number = 1; i < input.length; i++) {
                if (input[i] === '(') {
                    counter += 1;
                } else if (input[i] === ')') {
                    counter -= 1;
                }
                if (counter === 0) {
                    node.left = Term.parseExpression(input.substring(1, i));
                    node.right = Term.parseExpression(input.substring(i + 2, input.length - 1));
                    return node;
                }
            }
            return null;
        } else {
            for (let i: number = 1; i < input.length; i++) {
                if (input[i] === '=' && i + 1 < input.length && input[i + 1] === '>') {
                    //function
                    let node: Term | null = new Term("func");
                    node.left = Term.parseExpression(input.substring(0, i));
                    node.right = Term.parseExpression(input.substring(i + 2));
                    return node;
                }
            }
            return new Term("var", input);
        }
    }


    static alphaConvert(x: Term) {
        Term.indexBoundVariables(x, 0, []);
    }

    static indexBoundVariables(x: Term, counter: number, stack: Term[]): number {
        if (x.type === "func") {
            counter += 1;
            if (x.left && x.left.type === "var") {
                x.left.index = counter;
                if (x.right) {
                    stack.push(x.left);
                    counter = Term.indexBoundVariables(x.right, counter, stack);
                    stack.pop();
                }
            }
            return counter;
        }
        else if (x.type === "app") {
            if (x.left) {
                counter = Term.indexBoundVariables(x.left, counter, stack);
            }
            if (x.right) {
                counter = Term.indexBoundVariables(x.right, counter, stack);
            }
            return counter;
        }
        else if (x.type === "var") {
            for (let i = stack.length - 1; 0 <= i; i--) {
                if (stack[i].name && stack[i].name === x.name) {
                    x.index = stack[i].index;
                    return counter;
                }
            }
            x.index = 0;
        }
        return counter;
    }


    static betaSubstitue(x: Term, subs: Term, boundVarId: number) : boolean{
        if (x.type === "var" && x.index === boundVarId) {
            let dup = subs.duplicate();
            if(!dup){
                console.log("duplication of subs failed");
                return false;
            }

            x.left = dup.left;
            x.right = dup.right;
            x.type = dup.type;
            x.name = dup.name;
            x.index = -1;

            return true;
        } else if (x.type === "func" && x.right) {
            Term.betaSubstitue(x.right, subs,boundVarId);
            return true;
        }else if(x.type === "app" && x.left && x.right){
            Term.betaSubstitue(x.left,subs,boundVarId);
            Term.betaSubstitue(x.right,subs,boundVarId);
            return true;
        }
        return false;
    }

    static betaReduce(x: Term): boolean {
        if (!x.isRedex() || !x.left || !x.right || !x.left.left || !x.left.right) {
            return false;
        }
        let boundVarId = x.left?.left?.index;
        if (boundVarId === undefined) {
            return false;
        }


        Term.betaSubstitue(x.left?.right, x.right, boundVarId);
        x.right = undefined;

        let reduced = x.left.right;
        x.left = reduced.left;
        x.right = reduced.right;
        x.type = reduced.type;
        x.name = reduced.name;
        x.index = -1;
        
        return true;
    }



}



function evaluateExpr() {
    let inputbox = document.getElementById("input-text") as HTMLInputElement | null;
    if (inputbox) {
        let inputExpr: string | null = inputbox.value;
        if (inputExpr) {
            let root: Term | null = Term.parseExpression(inputExpr);
            if (root) {
                NodeStorage.getInstance().root = root;
                root.setCoordinates(0, 0);
                Term.alphaConvert(root);
                let svgCanvas = document.getElementById("canvas") as HTMLElement | null;
                if (svgCanvas) {
                    svgCanvas.innerHTML = root.getSVGInnerHTML();
                }

            } else {
                console.log("failed to parse expression");
            }
        } else {
            console.log("failed to get input box content")
        }
    }
    else {
        console.log("failed to get inputbox");
    }
}


function onClickRedex(nodeid: number): void {
    let redex = NodeStorage.getInstance().getNode(nodeid);
    if (redex === undefined) {
        console.log("clicked redex is undefined");
        return;
    }
    Term.betaReduce(redex as Term);

    let root = NodeStorage.getInstance().root;
    if(root){
        root.setCoordinates(0,0);
        Term.alphaConvert(root);
        let svgCanvas = document.getElementById("canvas") as HTMLElement | null;
        if (svgCanvas) {
            svgCanvas.innerHTML = root.getSVGInnerHTML();
        }
        let text =document.getElementById("output-text") as HTMLElement | null;
        if(text){
            text.innerHTML = root.toString();
        }
    }

}