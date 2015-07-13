/* global AutoForm */

Template.quickForm.helpers({
  getTemplateName: function () {
    return AutoForm.getTemplateName('quickForm', this.template);
  },
  innerContext: function quickFormContext() {
    var atts = AutoForm.parseData(_.clone(this));
    var sortedSchema = {};
    var fieldGroups = [];

    // --------------- A. Schema --------------- //
    // get schema
    // note: replace this by a standard function?

    if (atts.fields) {
      // if atts.fields exists, transform it into an array
      // note: is there a standard function we can use here instead of replace and split?
      atts.fields = atts.fields.replace(' ', '').split(',');

      // then loop over atts.fields to restrict the schema to its fields and reorder it
      var simpleSchema = atts._resolvedSchema;
      atts.fields.forEach(function (fieldName) {
        var genericFieldName = SimpleSchema._makeGeneric(fieldName); // use '$'' instead of '0'
        sortedSchema[fieldName] = simpleSchema.schema(genericFieldName);
      });
    }

    // --------------- B. Field With No Groups --------------- //

    // copy atts
    var defaultGroup = {name: '_defaultGroup', atts: _.clone(atts)};

    // get all fields with no field group specified
    // but exclude fields whose name end with a '$'
    defaultGroup.atts.fields = _.map(sortedSchema, function (field, fieldName) {
      return fieldName &&
        (fieldName.slice(-1) !== '$') &&
        (!field.autoform || !field.autoform.group);
    });
    defaultGroup.atts.fields = _.compact(defaultGroup.atts.fields);

    // do not push empty groups
    if (!!defaultGroup.atts.fields.length) {
      fieldGroups.push(defaultGroup);
    }

    // --------------- C. Field With Groups --------------- //

    // get list of unique field groups with any falsy values removed
    var fieldGroupNames = _.compact(_.unique(_.map(sortedSchema, function (field) {
      return field.autoform && field.autoform.group ;
    }))).sort();

    // loop over field group names, and push relevant field to fieldGroups array
    // but exclude fields whose name end with a '$'
    _.each(fieldGroupNames, function (fieldGroupName) {
      // for each field group, get list of field names
      var fieldsForGroup = _.compact(_.map(sortedSchema, function (field, fieldName) {
        return (fieldName.slice(-1) !== '$') && field.autoform && field.autoform.group && field.autoform.group === fieldGroupName && fieldName;
      }));

      // make sure the group is not empty
      if (!!fieldsForGroup.length) {

        // copy parent atts over to field group context, while adding 'name' and overwriting 'fields'
        var group = {
          name: fieldGroupName,
          atts: _.clone(atts) // note: clone atts to make sure we don't modify the original
        };
        group.atts.fields = fieldsForGroup;
        fieldGroups.push(group);
      }

    });


    // --------------- D. Context --------------- //

    // Pass along quickForm context to autoForm context, minus a few
    // properties that are specific to quickForms.
    var qfAutoFormContext = _.omit(atts,
                                   'buttonContent',
                                   'buttonClasses',
                                   'fields',
                                   'omitFields',
                                   'id-prefix');

    // Determine whether we want to render a submit button
    var qfShouldRenderButton = (atts.buttonContent !== false && atts.type !== 'readonly' && atts.type !== 'disabled');

    var context = {
      qfAutoFormContext: qfAutoFormContext,
      atts: atts,
      qfShouldRenderButton: qfShouldRenderButton,
      fieldGroups: fieldGroups
    };
    return context;
  }
});
