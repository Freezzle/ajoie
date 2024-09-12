export class ErrorModel {
    errorKey: string | null = null;
    translateKey: string | null = null;
    translateValues: { [key: string]: unknown } = {};

    public static required(): ErrorModel {
        const errorModel = new ErrorModel();
        errorModel.errorKey = 'required';
        errorModel.translateKey = 'common.validation.required';
        errorModel.translateValues = {};

        return errorModel;
    }

    public static minlength(length: number): ErrorModel {
        const errorModel = new ErrorModel();
        errorModel.errorKey = 'minlength';
        errorModel.translateKey = 'common.validation.minlength';
        errorModel.translateValues = {min: length};

        return errorModel;
    }

    public static maxlength(length: number): ErrorModel {
        const errorModel = new ErrorModel();
        errorModel.errorKey = 'maxlength';
        errorModel.translateKey = 'common.validation.maxlength';
        errorModel.translateValues = {max: length};

        return errorModel;
    }

    public static min(length: number): ErrorModel {
        const errorModel = new ErrorModel();
        errorModel.errorKey = 'min';
        errorModel.translateKey = 'common.validation.min';
        errorModel.translateValues = {min: length};

        return errorModel;
    }

    public static max(length: number): ErrorModel {
        const errorModel = new ErrorModel();
        errorModel.errorKey = 'max';
        errorModel.translateKey = 'common.validation.max';
        errorModel.translateValues = {max: length};

        return errorModel;
    }

    public static number(): ErrorModel {
        const errorModel = new ErrorModel();
        errorModel.errorKey = 'number';
        errorModel.translateKey = 'common.validation.number';
        errorModel.translateValues = {};

        return errorModel;
    }

    public static pattern(regex: string): ErrorModel {
        const errorModel = new ErrorModel();
        errorModel.errorKey = 'pattern';
        errorModel.translateKey = 'common.validation.pattern';
        errorModel.translateValues = {pattern: regex};

        return errorModel;
    }

    public static custom(errorKey: string, translateKey: string, translateValues?: any) {
        const errorModel = new ErrorModel();
        errorModel.errorKey = errorKey;
        errorModel.translateKey = translateKey;
        errorModel.translateValues = translateValues;

        return errorModel;
    }
}
