const box_width : number = 20;
const radius : number = 10;

class DrawableNode {
    left?: DrawableNode | null;
    right?: DrawableNode | null;
    
    coord_x:number = 0;
    coord_y:number = 0;
    left_width:number = 0;
    right_width:number = 0;

    public setCoordinates(x:number , y:number){
        this.coord_x = x;
        this.coord_y = y;
    }


    private measureTree() : void{
        this.left_width = 0;
        this.right_width = 0;
        if(this.left) {
            this.left.measureTree();
            this.left_width = this.left.left_width + box_width + this.left.right_width;
        }
        if(this.right){
            this.right.measureTree();
            this.right_width = this.right.left_width + box_width + this.right.right_width;
        }
    }


    private computCoordinates() : void{
        if(this.left) {
            this.left.setCoordinates(
                this.coord_x - box_width - this.left.right_width,
                this.coord_y + box_width
            );
            this.left.computCoordinates();
        }
        if(this.right) {
            this.right.setCoordinates(
                this.coord_x + box_width + this.right.left_width,
                this.coord_y + box_width
            );
            this.right.computCoordinates();
        }
    }


    private getSVGCircles(): string {
        let innerHTML: string = `<circle cx="${this.coord_x}" cy="${this.coord_y}" r="${radius}" stroke="black" fill="none" />`;
        if (this.left) {
            innerHTML += this.left.getSVGCircles();
        }
        if (this.right) {
            innerHTML += this.right.getSVGCircles();
        }
        return innerHTML;
    }
    

    public getSVGInnerHTML():string {
        let innerHTML : string = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1">';
        this.measureTree();
        this.setCoordinates(
            this.left_width + box_width,
            box_width
        )
        this.computCoordinates();
        innerHTML += this.getSVGCircles() + "</svg>"
        return innerHTML;
    }
}





class Term extends DrawableNode{
    public type: string = "udf";
    public name?: string | null;
    public left?: Term | null;
    public right?: Term | null;

    constructor(type: string, name?: string | null, left?: Term | null, right?: Term | null) {
        super();
        this.type = type;
        this.name = name;
        this.left = left;
        this.right = right;
    }

    public toString() : string {
        if (this.type === "var") {
            return this.name ?? "";
        } else if (this.type === "func") {
            return this.left?.toString() + "=>" + this.right?.toString();
        } else if (this.type === "app") {
            return "(" + this.left?.toString() + ")(" + this.right?.toString() + ")";
        }
        return "";
    }


    
    static parseExpression(input: string): Term | null {
        if(!input){
            return null;
        }
        let node: Term | null = null;
        if(input[0] === '('){
            node  = new Term("app");
            let counter:number = 1;
            for(let i : number = 1; i < input.length; i++ ){
                if(input[i] === '('){
                    counter += 1 ;
                }else if (input[i] === ')'){
                    counter-=1;
                }
                if(counter === 0){
                    node.left = Term.parseExpression(input.substring(1,i));
                    node.right = Term.parseExpression(input.substring(i+2,input.length-1));
                    return node;
                }
            }
            return null;
        }else{
            for (let i: number = 1 ; i<input.length ; i++ ){
                if(input[i] === '=' && i + 1 < input.length && input[ i + 1] === '>'){
                    //function
                    let node: Term | null = new Term("func");
                    node.left = Term.parseExpression(input.substring(0,i));
                    node.right = Term.parseExpression(input.substring(i+2));
                    return node;
                }
            }
            return new Term("var",input);
        }
    }
}



function evaluateExpr() {
    let inputbox = document.getElementById("input-text") as HTMLInputElement | null;
    if (inputbox) {
        let inputExpr: string | null = inputbox.value;
        if (inputExpr) {
            let root : Term | null = Term.parseExpression(inputExpr);
            if(root){
                console.log("binary tree to string: ", root.toString())
                root.setCoordinates(0,0);
                
                let svgCanvas = document.getElementById("canvas") as HTMLElement | null;
                if (svgCanvas) {
                    svgCanvas.innerHTML = root.getSVGInnerHTML();
                }

            }else{
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

