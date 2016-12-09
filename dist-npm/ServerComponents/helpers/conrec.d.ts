export interface IGenericPoint<T> {
    x: T;
    y: T;
}
/**
 * An (x,y) point
 */
export interface IPoint extends IGenericPoint<number> {
}
/**
 * A linked list of type T
 */
export interface ILinkedList<T> {
    head?: ILinkedList<T>;
    tail?: ILinkedList<T>;
    next?: ILinkedList<T>;
    prev?: ILinkedList<T>;
    p?: IGenericPoint<T>;
}
/**
 * A linked list of type T
 */
export interface ILinkedPointList extends ILinkedList<number> {
    closed?: boolean;
}
export interface IDrawContour {
    (startX: number, startY: number, endX: number, endY: number, contourLevel: number, k: number): void;
}
/**
  * Implements CONREC.
  *
  * @param {function} drawContour function for drawing contour.  Defaults to a
  *                               custom "contour builder", which populates the
  *                               contourList property.
  */
export declare class Conrec {
    private h;
    private sh;
    private xh;
    private yh;
    private contours;
    /**
     * Create a new Conrec class, optionally specifying the function to use for drawing the contour line.
     * @param  {number} drawContour [description]
     * @return {[type]}             [description]
     */
    constructor(drawContour?: IDrawContour);
    /**
     * contour is a contouring subroutine for rectangularily spaced data
     *
     * It emits calls to a line drawing subroutine supplied by the user which
     * draws a contour map corresponding to real*4data on a randomly spaced
     * rectangular grid. The coordinates emitted are in the same units given in
     * the x() and y() arrays.
     *
     * Any number of contour levels may be specified but they must be in order of
     * increasing value.
     *
     *
     * @param {number[][]} d - matrix of data to contour
     * @param {number} ilb,iub,jlb,jub - index lower and upper bounds of data matrix,
     *                                 	 i in rows/latitude direction, j in columns/longitude direction
     *
     *             The following two, one dimensional arrays (x and y) contain
     *             the horizontal and vertical coordinates of each sample points.
     * @param {number[]} x  - data matrix column coordinates, e.g. latitude coordinates
     * @param {number[]} y  - data matrix row coordinates, e.g. longitude coordinates
     * @param {number} nc   - number of contour levels
     * @param {number[]} z  - contour levels in increasing order.
     */
    contour(d: number[][], ilb: number, iub: number, jlb: number, jub: number, x: number[], y: number[], nc: number, z: number[], noDataValue?: number): void;
    /**
     * drawContour - interface for implementing the user supplied method to
     * render the countours.
     *
     * Draws a line between the start and end coordinates.
     *
     * @param startX    - start coordinate for X
     * @param startY    - start coordinate for Y
     * @param endX      - end coordinate for X
     * @param endY      - end coordinate for Y
     * @param contourLevel - Contour level for line.
     */
    private drawContour(startX, startY, endX, endY, contourLevel, k);
    readonly contourList: IContourList;
}
export interface IContour extends Array<{
    x: number;
    y: number;
}> {
    k: number;
    level: number;
}
export interface IContourList extends Array<IContour> {
}
