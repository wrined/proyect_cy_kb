import 'plugins/search_vis/search_vis_controller';
import 'plugins/search_vis/search_vis.less';
import TemplateVisTypeTemplateVisTypeProvider from
    'ui/template_vis_type/template_vis_type';
import markdownVisTemplate from 'plugins/search_vis/search_vis.html';
import markdownVisParamsTemplate from
    'plugins/search_vis/search_vis_params.html';
// we need to load the css ourselves

// we also need to load the controller and used by the template

// register the provider with the visTypes registry so that other know it exists
require('ui/registry/vis_types').register(MarkdownVisProvider);

function MarkdownVisProvider(Private) {
    const TemplateVisType = Private(TemplateVisTypeTemplateVisTypeProvider);

    // return the visType object, which kibana will use to display and configure new
    // Vis object of this type.
    return new TemplateVisType({
        name: 'search',
        title: 'search widget',
        icon: 'fa-code',
        description: 'Useful for displaying urls search.',
        template: markdownVisTemplate,
        params: {
            editor: markdownVisParamsTemplate
        },
        requiresSearch: false
    });
}

// export the provider so that the visType can be required with Private()
export default MarkdownVisProvider;
