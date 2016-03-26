import Api = require('../api/ApiManager');
import GeoJSON = require('../helpers/GeoJSON');
export interface IGridDataSourceParameters extends Api.IProperty {
    /**
     * Grid type, for example 'custom' (default) or 'esri' ASCII Grid
     */
    gridType?: string;
    /**
     * Projection of the ESRI ASCII GRID
     */
    projection?: string;
    /**
     * Property name of the cell value of the generated json.
     */
    propertyName?: string;
    /**
     * Skip a comment line when it starts with this character
     */
    commentCharacter?: string;
    /**
     * Character that separates cells. Default is space.
     */
    separatorCharacter?: string;
    /**
     * Skip a number of lines from the start.
     */
    skipLines?: number;
    /**
     * Skip a number of lines after a comment block ends.
     */
    skipLinesAfterComment?: number;
    /**
     * Skip a number of spaces from the start of the line.
     */
    skipSpacesFromLine?: number;
    /**
     * Number of grid columns.
     */
    columns?: number;
    /**
     * Number of grid rows.
     */
    rows?: number;
    /**
     * Start latitude in degrees.
     */
    startLat?: number;
    /**
     * Start longitude in degrees.
     */
    startLon?: number;
    /**
     * Add deltaLat after processing a grid cell.
     * NOTE: When the direction is negative, use a minus sign e.g. when counting from 90 to -90..
     */
    deltaLat?: number;
    /**
     * Add deltaLon degrees after processing a grid cell.
     */
    deltaLon?: number;
    /**
     * Skip a first column, e.g. containing the latitude degree.
     */
    skipFirstColumn?: boolean;
    /**
     * Skip a first row, e.g. containing the longitude degree.
     */
    skipFirstRow?: boolean;
    /**
     * When the cell value is below this threshold, it is ignored.
     */
    minThreshold?: number;
    /**
    * When the cell value is above this threshold, it is ignored.
     */
    maxThreshold?: number;
    /**
     * The input values to be NoData in the output raster. Optional. Default is -9999.
     */
    noDataValue?: number;
    /** If true, use the CONREC contouring algorithm to create isoline contours */
    useContour?: boolean;
    /** When using contours, this specifies the number of contour levels to use. */
    contourLevels?: number | number[];
}
export declare class IsoLines {
    /**
     * Convert the ESRI ASCII GRID header to grid parameters.
     *
        ESRI ASCII Raster format
        The ESRI ASCII raster format can be used to transfer information to or from other cell-based or raster systems. When an existing raster is output to an ESRI ASCII format raster, the file will begin with header information that defines the properties of the raster such as the cell size, the number of rows and columns, and the coordinates of the origin of the raster. The header information is followed by cell value information specified in space-delimited row-major order, with each row seperated by a carraige return.
        In order to convert an ASCII file to a raster, the data must be in this same format. The parameters in the header part of the file must match correctly with the structure of the data values.
        The basic structure of the ESRI ASCII raster has the header information at the beginning of the file followed by the cell value data:
        NCOLS xxx
        NROWS xxx
        XLLCENTER xxx | XLLCORNER xxx
        YLLCENTER xxx | YLLCORNER xxx
        CELLSIZE xxx
        NODATA_VALUE xxx
        row 1
        row 2
        ...
        row n
        *
        Row 1 of the data is at the top of the raster, row 2 is just under row 1, and so on.
        Header format
        The syntax of the header information is a keyword paired with the value of that keyword. The definitions of the kewords are:
        *
        Parameter	Description	Requirements
        NCOLS	Number of cell columns.	Integer greater than 0.
        NROWS	Number of cell rows.	Integer greater than 0.
        XLLCENTER or XLLCORNER	X coordinate of the origin (by center or lower left corner of the cell).	Match with Y coordinate type.
        YLLCENTER or YLLCORNER	Y coordinate of the origin (by center or lower left corner of the cell).	Match with X coordinate type.
        CELLSIZE	Cell size.	Greater than 0.
        NODATA_VALUE	The input values to be NoData in the output raster.	Optional. Default is -9999.
        Data format
        The data component of the ESRI ASCII raster follows the header information.
        Cell values should be delimited by spaces.
        No carriage returns are necessary at the end of each row in the raster. The number of columns in the header determines when a new row begins.
        Row 1 of the data is at the top of the raster, row 2 is just under row 1, and so on.
     */
    static convertEsriHeaderToGridParams(input: string | Object, gridParams: IGridDataSourceParameters): void;
    /** Extract the grid data from the input */
    private static getData(input);
    /**
     * Convert the incoming data to a matrix grid.
     * The incoming data can be in two formats: either it is a string, representing the ASCII grid data,
     * or it is an (ILayer) object, in which case the data should be in the input.data property.
     */
    static convertDataToGrid(input: string | Object, gridParams: IGridDataSourceParameters): number[][];
    /**
     * Convert data to a set of isolines.
     */
    static convertDataToIsoLines(data: string, gridParams: IGridDataSourceParameters): GeoJSON.IGeoJson;
}
