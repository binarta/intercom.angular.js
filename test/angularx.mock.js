angular.module('angularx', [])
    .service('resourceLoader', function () {
        return jasmine.createSpyObj('resourceLoader', ['addScript']);
    });