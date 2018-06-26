/**
 * Translated Jason Davies' JavaScript version to TypeScript in 2015.
 * Erik Vullings
 *
 * Copyright (c) 2010, Jason Davies.
 *
 * All rights reserved.  This code is based on Bradley White's Java version,
 * which is in turn based on Nicholas Yue's C++ version, which in turn is based
 * on Paul D. Bourke's original Fortran version.  See below for the respective
 * copyright notices.
 *
 * See http://paulbourke.net/papers/conrec for the original
 * paper by Paul D. Bourke.
 *
 * The vector conversion code is based on http://apptree.net/conrec.htm by
 * Graham Cox.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the <organization> nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
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
    private drawContour;
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
