"use strict";
app.controller("ElectroluxRegisterController", [
  "$scope",
  "$rootScope",
  "ngAppSettings",
  "$routeParams",
  "$location",
  "AuthService",
  "RestAttributeSetDataElectroluxService",
  "RestRelatedAttributeDataPortalService",
  "RestAttributeFieldPortalService",
  function (
    $scope,
    $rootScope,
    ngAppSettings,
    $routeParams,
    $location,
    authService,
    service,
    navService,
    fieldService
  ) {
    BaseRestCtrl.call(
      this,
      $scope,
      $rootScope,
      $location,
      $routeParams,
      ngAppSettings,
      service
    );
    $scope.queries = {
      status: "",
    };
    $scope.data = {};
    $scope.exportAll = true;
    $scope.settings = $rootScope.globalSettings;
    $scope.request.orderBy = "CreatedDateTime";
    $scope.request.direction = "Desc";
    $scope.filterType = "contain";
    $scope.defaultId = "default";
    $scope.attributeSetId = 10;
    $scope.attributeSetName = "register";
    $scope.importFile = {
      file: null,
      fullPath: "",
      folder: "import",
      title: "",
      description: "",
    };
    $scope.statuses = [
      {
        text: "All",
        value: "",
      },
      {
        text: "Open",
        value: "Open",
      },
      {
        text: "Invalid",
        value: "Invalid",
      },
      {
        text: "Reject",
        value: "Reject",
      },
    ];
    $scope.init = async function () {
      var getFields = await fieldService.initData($scope.attributeSetName);
      if (getFields.isSucceed) {
        $scope.fields = getFields.data;
        $scope.$apply();
      }
      if (!$rootScope.isInRoles(["Admin", "SuperAdmin", "QC"])) {
        $scope.queries.admin = authService.authentication.userName;
      }
      $scope.attributeSetId = $scope.attributeSetId;
      $scope.attributeSetName = $scope.attributeSetName;
      $scope.parentId = $routeParams.parentId;
      $scope.parentType = $routeParams.parentType;
      $scope.request.attributeSetName = $scope.attributeSetName;
      $scope.backUrl = "/portal/electrolux-register/list";
      if ($routeParams.dataId != $scope.defaultId) {
        $scope.dataId = $routeParams.dataId;
      }

      if ($scope.parentId && $scope.parentType) {
        $scope.refDataModel = {
          parentId: $scope.parentId,
          parentType: $scope.parentType,
        };
      }
    };
    $scope.selectData = function () {
      if ($scope.selectedList.data.length) {
        $scope.activedData = $scope.selectedList.data[0];
      }
    };
    $scope.saveSuccessCallback = function () {
      if ($location.path() == "/portal/attribute-set-data/create") {
        $scope.goToDetail($scope.activedData.id, "attribute-set-data");
      }
    };

    $scope.preview = function (item) {
      item.fields = $scope.fields;
      $scope.register = item;
      $("#dlg-electrolux-preview").modal("show");
    };

    $scope.edit = function (data) {
      $scope.goToPath(
        `/portal/attribute-set-data/details?dataId=${data.id}&backurl=${$scope.backUrl}`
      );
    };

    $scope.remove = function (data) {
      $rootScope.showConfirm(
        $scope,
        "removeConfirmed",
        [data.id],
        null,
        "Remove",
        "Deleted data will not able to recover, are you sure you want to delete this item?"
      );
    };

    $scope.removeConfirmed = async function (dataId) {
      $rootScope.isBusy = true;
      var result = await service.delete([dataId]);
      if (result.isSucceed) {
        if ($scope.removeCallback) {
          $rootScope.executeFunctionByName(
            "removeCallback",
            $scope.removeCallbackArgs,
            $scope
          );
        }
        $scope.getList();
      } else {
        $rootScope.showMessage("failed");
        $rootScope.isBusy = false;
        $scope.$apply();
      }
    };
    $scope.import = async function () {
      if ($scope.validateDataFile()) {
        $rootScope.isBusy = true;
        var form = document.getElementById("frm-import");
        var result = await service.import(
          $scope.attributeSetName,
          form["data"].files[0]
        );
        if (result.isSucceed) {
          $rootScope.showMessage("success", "success");
          $rootScope.isBusy = false;
          $scope.getList(0);
        } else {
          $rootScope.showMessage("failed");
          $rootScope.isBusy = false;
          $scope.$apply();
        }
      }
    };
    $scope.validateDataFile = function () {
      if (!$scope.importFile.file) {
        $rootScope.showMessage("Please choose data file", "danger");
        return false;
      } else {
        return true;
      }
    };
    $scope.sendMail = function (data) {
      var email = "";
      angular.forEach(data.values, function (e) {
        if (e.attributeFieldName == "email") {
          email = e.stringValue;
        }
      });
      $rootScope.showConfirm(
        $scope,
        "sendMailConfirmed",
        [data],
        null,
        "Send mail",
        "Are you sure to send mail to " + email
      );
    };
    $scope.sendMailConfirmed = async function (data) {
      $rootScope.isBusy = true;
      $rootScope.isBusy = true;
      var result = await service.sendMail([data.id]);
      if (result.isSucceed) {
        $rootScope.showMessage("success", "success");
        $rootScope.isBusy = false;
        $scope.$apply();
      } else {
        $rootScope.showMessage("failed");
        $rootScope.isBusy = false;
        $scope.$apply();
      }
    };
    $scope.saveOthers = async function () {
      var response = await service.saveList($scope.others);
      if (response.isSucceed) {
        $scope.getList();
        $scope.$apply();
      } else {
        $rootScope.showErrors(response.errors);
        $rootScope.isBusy = false;
        $scope.$apply();
      }
    };
    $scope.selectImportFile = function (files) {
      if (files !== undefined && files !== null && files.length > 0) {
        const file = files[0];
        $scope.importFile.folder = "imports";
        $scope.importFile.title = $scope.attributeSetName;
        $scope.importFile.description = $scope.attributeSetName + "'s data";
        $scope.importFile.file = file;

        // if (ctrl.auto=='true') {
        //     ctrl.uploadFile(file);
        // }
        // else {
        //     ctrl.getBase64(file);
        // }
      }
    };
    $scope.getList = async function (pageIndex) {
      if (pageIndex !== undefined) {
        $scope.request.pageIndex = pageIndex;
      }
      if ($scope.request.fromDate !== null) {
        var df = new Date($scope.request.fromDate);
        $scope.request.fromDate = df.toISOString();
      }
      if ($scope.request.toDate !== null) {
        var dt = new Date($scope.request.toDate);
        $scope.request.toDate = dt.toISOString();
      }
      var query = {};
      if ($scope.attributeSetId) {
        $scope.request.attributeSetId = $scope.attributeSetId;
      }
      $scope.request.attributeSetName = $scope.attributeSetName;
      $scope.request.filterType = $routeParams.filterType || "contain";
      Object.keys($scope.queries).forEach((e) => {
        if ($scope.queries[e]) {
          query[e] = $scope.queries[e];
        }
      });
      $scope.request.query = JSON.stringify(query);
      $rootScope.isBusy = true;
      var resp = await service.getList($scope.request);
      if (resp && resp.isSucceed) {
        $scope.data = resp.data;
        $.each($scope.data.items, function (i, data) {
          $.each($scope.activeddata, function (i, e) {
            if (e.dataId === data.id) {
              data.isHidden = true;
            }
          });
        });
        if ($scope.getListSuccessCallback) {
          $scope.getListSuccessCallback();
        }
        $("html, body").animate(
          {
            scrollTop: "0px",
          },
          500
        );
        // if (!resp.data || !resp.data.items.length) {
        //   $scope.queries = {};
        // }
        $rootScope.isBusy = false;
        $scope.$apply();
      } else {
        if (resp) {
          $rootScope.showErrors(resp.errors);
        }
        if ($scope.getListFailCallback) {
          $scope.getListFailCallback();
        }
        $scope.queries = {};
        $rootScope.isBusy = false;
        $scope.$apply();
      }
    };
    $scope.export = async function (pageIndex, exportAll) {
      if (pageIndex !== undefined) {
        $scope.request.pageIndex = pageIndex;
      }
      if ($scope.request.fromDate !== null) {
        var df = new Date($scope.request.fromDate);
        $scope.request.fromDate = df.toISOString();
      }
      if ($scope.request.toDate !== null) {
        var dt = new Date($scope.request.toDate);
        $scope.request.toDate = dt.toISOString();
      }
      var query = {};
      if ($scope.attributeSetId) {
        $scope.request.attributeSetId = $scope.attributeSetId;
      }
      $scope.request.attributeSetName = $scope.attributeSetName;
      $scope.request.filterType = $routeParams.filterType || "contain";
      Object.keys($scope.queries).forEach((e) => {
        if ($scope.queries[e]) {
          query[e] = $scope.queries[e];
        }
      });
      $scope.request.query = JSON.stringify(query);
      var request = angular.copy($scope.request);
      $scope.exportAll = $scope.exportAll;
      if (exportAll) {
        request.pageSize = 10000;
        request.pageIndex = 0;
      }
      $rootScope.isBusy = true;
      var resp = await service.export(request);
      if (resp && resp.isSucceed) {
        if (resp.data) {
          window.top.location = resp.data.webPath;
        } else {
          $rootScope.showMessage("Nothing to export");
        }
        $rootScope.isBusy = false;
        $scope.$apply();
      } else {
        if (resp) {
          $rootScope.showErrors(resp.errors);
        }
        $rootScope.isBusy = false;
        $scope.$apply();
      }
    };
  },
]);
