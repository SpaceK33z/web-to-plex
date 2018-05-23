document.body.onload = function() {
    var elements = document.querySelectorAll('[disabled], [is-shy], [is-slow], [save-file], [cost-cash], [cost-more-cash], [cost-most-cash]'),
        messages = {
            "disabled": "Not yet implemented",
            "save-file": "Uses file downloads before your managers",
            "is-shy": "Can only be accessed via: {*}",
            "is-slow": "Resource intensive (loads slowly)",
            // $0.99 one time; $0.99 - $9.99/mon
            "cost-cash-low": "At least {*} (fair)",
            // $9.99 one time; $9.99 - $29.99/mon
            "cost-cash-med": "At least {*} (pricy)",
            // $29.99 one time; $29.99 - $99.99/mon
            "cost-cash-hig": "At least {*} (expensive)"
        };

    for(var element, index = 0, length = elements.length; index < length; index++) {
        element = elements[index];
        for(var message in messages)
            if(message in element.attributes)
                element.title = `${ messages[message].replace(/\{\*\}/g, element.getAttribute(message)) }. ${ element.title }`;
    }
}
