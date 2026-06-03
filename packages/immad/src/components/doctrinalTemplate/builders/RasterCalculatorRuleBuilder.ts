import { DataSource, ImageServiceDataSource } from '../api/DataSources';
import Rule, { OperationType } from '../api/Rule';
import RasterFunction from '@arcgis/core/layers/support/RasterFunction';
import ImageryLayer from '@arcgis/core/layers/ImageryLayer';
import { ImageServiceURLVariable } from '../api/RasterFunctionVariable';
import { ConfigHelper } from '../../../helpers/configHelper';
import IdentityManager from '@arcgis/core/identity/IdentityManager';

/**
 * Builds a Raster Calculator Function from a set of Doctrinal Template Rules.
 * The output is a Raster Calculator Raster Function.
 */
class RasterCalculatorRuleBuilder {
    private inputMap: {
        [name: string]: ImageServiceURLVariable;
    };
    private expressions: string[];
    private remapUrls: boolean | undefined;
    private urlRemapRules: Array<{ url: string; remapUrl: string }> | undefined;

    constructor() {
        this.inputMap = {};
        this.expressions = [];
        const appConfig = ConfigHelper.getAppConfig();
        this.remapUrls = appConfig.remapUrls;
        this.urlRemapRules = appConfig.urlRemapRules;
    }

    /**
     * Creates a Raster Function variable from a Data Source.
     * @param dataSource The input Data Source
     * @private
     */
    private async createVariable(dataSource: DataSource): Promise<ImageServiceURLVariable> {
        switch (dataSource.type) {
            case 'ImageService':
                const imageServiceDataSource = dataSource as ImageServiceDataSource;
                const layer = imageServiceDataSource.layer as ImageryLayer;

                // Workaround for PKI issue.  Remap the url of the data source to a non-pki
                // secured url.
                let url = layer.url;
                if (this.remapUrls) {
                    this.urlRemapRules?.forEach((remapRule) => {
                        if (url.includes(remapRule.url)) {
                            url = url.replace(remapRule.url, remapRule.remapUrl);
                        }
                    });
                }

                // Append the token to the end of the url per ArcGIS documentation
                // https://developers.arcgis.com/rest/services-reference/enterprise/raster-input.htm
                const credential = await IdentityManager.getCredential(layer.url);
                if (credential && credential.token) {
                    url = url + '?token=' + credential.token;
                }

                return {
                    url: url,
                    name: dataSource.id,
                };
        }
        throw new Error('DataSource type "' + dataSource.type + '" is not implemented.');
    }

    /**
     * Converts the operation type into a Raster Calculator expression string.
     * @param operationType
     * @private
     */
    private static getRasterCalculatorOperation(operationType: OperationType): string {
        switch (operationType) {
            case OperationType.Equal:
                return '==';
            case OperationType.NotEqual:
                return '!=';
            case OperationType.GreaterThan:
                return '>';
            case OperationType.GreaterThanEqualTo:
                return '>=';
            case OperationType.LessThan:
                return '<';
            case OperationType.LessThanEqualTo:
                return '<=';
        }
        throw new Error('Unknown function type: ' + operationType);
    }

    /**
     * Add a Data Source to the Raster Calcuator expression.
     * @param dataSources The datasources to add.
     */
    public async addDataSource(dataSource: DataSource): Promise<RasterCalculatorRuleBuilder> {
        if (!this.inputMap[dataSource.id]) {
            const variable = await this.createVariable(dataSource);
            this.inputMap[variable.name] = variable;
        }

        return this;
    }

    /**
     * Add a new rule to the Raster Calculator expression.
     * @param rule The Doctrinal Template Rule to add.
     * @param logicalOperation An optional logical operation to link the new expression with the existing expressions.
     *        If no logicalOperation is specified, "AND" is used.
     */
    public async addRule(rule: Rule, logicalOperation = '&'): Promise<RasterCalculatorRuleBuilder> {
        if (rule.enabled) {
            await this.addDataSource(rule.dataSource); // add data source, if it does not exist
            const operation = RasterCalculatorRuleBuilder.getRasterCalculatorOperation(rule.operation);

            if (this.expressions.length > 0) {
                this.expressions.push(` ${logicalOperation}`);
            }

            this.expressions.push(`( ${this.inputMap[rule.dataSource.id].name} ${operation} (${rule.constraint}) )`);
        }
        return this;
    }

    /**
     * Build the raster function based on the inputs provided.
     */
    public build(): RasterFunction {
        const expr = this.expressions.join(' ');
        return new RasterFunction({
            functionArguments: {
                Rasters: Object.values(this.inputMap),
                InputNames: Object.keys(this.inputMap),
                Expression: expr,
            },
            functionName: 'RasterCalculator',
            variableName: 'Raster',
        });
    }
}

export default RasterCalculatorRuleBuilder;
