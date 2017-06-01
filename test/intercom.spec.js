describe('intercom', function () {
    beforeEach(module('intercom'));

    var $rootScope, sut, config, resourceLoader, $window, intercomMock, binarta, getScriptDeferred;

    beforeEach(inject(function (_$rootScope_, $q, intercom, _config_, _resourceLoader_, _$window_, _binarta_) {
        $rootScope = _$rootScope_;
        sut = intercom;
        config = _config_;
        resourceLoader = _resourceLoader_;
        $window = _$window_;
        binarta = _binarta_;
        config.namespace = 'namespace';
        intercomMock = jasmine.createSpy('Intercom');
        getScriptDeferred = $q.defer();
        resourceLoader.getScript.and.returnValue(getScriptDeferred.promise);
        $window.Intercom = undefined;
        window.navigator = {
            userAgent: 'user agent'
        };
    }));

    function assertIntercomHasBeenBootedInUserMode() {
        expect(intercomMock).toHaveBeenCalledWith('boot', {
            app_id: config.intercomAppId,
            email: 'e',
            user_id: 'e',
            company: {
                id: config.namespace,
                name: config.namespace,
                url: 'http://server'
            },
            widget: {
                activator: "#IntercomDefaultWidget"
            }
        });
    }

    it('when no app id is defined, do nothing', function () {
        config.intercomAllowVisitors = true;
        sut();
        expect(resourceLoader.getScript).not.toHaveBeenCalled();
    });

    it('when app id is empty, do nothing', function () {
        config.intercomAppId = '';
        config.intercomAllowVisitors = true;
        sut();
        expect(resourceLoader.getScript).not.toHaveBeenCalled();
    });

    describe('with app id', function () {
        beforeEach(function () {
            config.intercomAppId = 'appId';
        });

        describe('allow visitors to use intercom', function () {
            beforeEach(function () {
                config.intercomAllowVisitors = true;
            });

            it('when useragent is phantomJS (which is used by prerender), do nothing', function () {
                window.navigator = {userAgent: 'user agent is PhantomJS'};
                sut();
                expect(resourceLoader.getScript).not.toHaveBeenCalled();
            });

            describe('and user is not signed in', function () {
                beforeEach(function () {
                    sut();
                });

                it('Intercom script is loaded', function () {
                    expect(resourceLoader.getScript).toHaveBeenCalledWith('https://widget.intercom.io/widget/' + config.intercomAppId);
                });

                describe('when script is loaded', function () {
                    beforeEach(function () {
                        $window.Intercom = intercomMock;
                        getScriptDeferred.resolve();
                        $rootScope.$digest();
                    });

                    it('Intercom is booted in visitor mode', function () {
                        expect(intercomMock).not.toHaveBeenCalledWith('shutdown');
                        expect(intercomMock).toHaveBeenCalledWith('boot', {
                            app_id: config.intercomAppId
                        });
                    });

                    describe('and user is signed in', function () {
                        beforeEach(function () {
                            intercomMock.calls.reset();
                            binarta.checkpoint.registrationForm.submit({username: 'u', password: 'p', email: 'e'});
                            $rootScope.$digest();
                        });

                        it('Intercom is restarted in user mode', function () {
                            expect(intercomMock).toHaveBeenCalledWith('shutdown');
                            assertIntercomHasBeenBootedInUserMode();
                        });
                    });
                });
            });

            describe('and user is signed in', function () {
                beforeEach(function () {
                    binarta.checkpoint.registrationForm.submit({username: 'u', password: 'p', email: 'e'});
                    sut();
                });

                describe('when script is loaded', function () {
                    beforeEach(function () {
                        $window.Intercom = intercomMock;
                        getScriptDeferred.resolve();
                        $rootScope.$digest();
                    });

                    it('Intercom is booted in user mode', function () {
                        expect(intercomMock).not.toHaveBeenCalledWith('shutdown');
                        assertIntercomHasBeenBootedInUserMode();
                    });

                    describe('and user signs out', function () {
                        beforeEach(function () {
                            intercomMock.calls.reset();
                            binarta.checkpoint.profile.signout();
                            $rootScope.$digest();
                        });

                        it('Intercom is restarted in visitor mode', function () {
                            expect(intercomMock).toHaveBeenCalledWith('shutdown');
                            expect(intercomMock).toHaveBeenCalledWith('boot', {
                                app_id: config.intercomAppId
                            });
                        });
                    });
                });
            });
        });

        describe('do not allow visitors to use Intercom', function () {
            beforeEach(function () {
                binarta.checkpoint.gateway.permissions = [];
            });

            describe('and user is not signed in', function () {
                beforeEach(function () {
                    sut();
                });

                it('Intercom script has not been loaded', function () {
                    expect(resourceLoader.getScript).not.toHaveBeenCalled();
                });

                describe('and user is signed in', function () {
                    beforeEach(function () {
                        binarta.checkpoint.registrationForm.submit({username: 'u', password: 'p', email: 'e'});
                        $rootScope.$digest();
                    });

                    it('Intercom script has not been loaded', function () {
                        expect(resourceLoader.getScript).not.toHaveBeenCalled();
                    });
                });

                describe('and user has the edit.mode permission', function () {
                    beforeEach(function () {
                        binarta.checkpoint.gateway.addPermission('edit.mode');
                    });

                    describe('and user is signed in', function () {
                        beforeEach(function () {
                            binarta.checkpoint.registrationForm.submit({username: 'u', password: 'p', email: 'e'});
                            $window.Intercom = intercomMock;
                            getScriptDeferred.resolve();
                            $rootScope.$digest();
                        });

                        it('Intercom script is loaded', function () {
                            expect(resourceLoader.getScript).toHaveBeenCalledWith('https://widget.intercom.io/widget/' + config.intercomAppId);
                        });

                        it('Intercom is booted in user mode', function () {
                            expect(intercomMock).not.toHaveBeenCalledWith('shutdown');
                            expect(intercomMock).toHaveBeenCalledWith('boot', {
                                app_id: config.intercomAppId,
                                email: 'e',
                                user_id: 'e',
                                company: {
                                    id: config.namespace,
                                    name: config.namespace,
                                    url: 'http://server'
                                },
                                widget: {
                                    activator: "#IntercomDefaultWidget"
                                }
                            });
                        });
                    });
                });
            });

            describe('and user is signed in', function () {
                describe('and user is not permitted', function () {
                    beforeEach(function () {
                        binarta.checkpoint.registrationForm.submit({username: 'u', password: 'p', email: 'e'});
                        sut();
                    });

                    it('Intercom script has not been loaded', function () {
                        expect(resourceLoader.getScript).not.toHaveBeenCalled();
                    });
                });

                describe('and user is permitted', function () {
                    beforeEach(function () {
                        binarta.checkpoint.gateway.addPermission('edit.mode');
                        binarta.checkpoint.registrationForm.submit({username: 'u', password: 'p', email: 'e'});
                        sut();
                        $window.Intercom = intercomMock;
                        getScriptDeferred.resolve();
                        $rootScope.$digest();
                    });

                    it('Intercom script is loaded', function () {
                        expect(resourceLoader.getScript).toHaveBeenCalledWith('https://widget.intercom.io/widget/' + config.intercomAppId);
                    });

                    it('Intercom is booted in user mode', function () {
                        expect(intercomMock).not.toHaveBeenCalledWith('shutdown');
                        assertIntercomHasBeenBootedInUserMode();
                    });

                    describe('and user signs out', function () {
                        beforeEach(function () {
                            intercomMock.calls.reset();
                            binarta.checkpoint.profile.signout();
                            $rootScope.$digest();
                        });

                        it('Intercom is restarted in visitor mode', function () {
                            expect(intercomMock).toHaveBeenCalledWith('shutdown');
                            expect(intercomMock).not.toHaveBeenCalledWith('boot');
                        });
                    });
                });
            });
        });
    });
});