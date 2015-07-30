angular.module('config', [])
    .provider('config', function configProvider() {
        var config = {};
        return {
            add: function (params) {
                Object.keys(params).forEach(function (k) {
                    config[k] = params[k];
                });
            },
            $get: function () {
                return config;
            }
        };
    });