const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;

const EMPTY_SINK = {
    get_description: function () {
        return 'Pusto'
    }
};

class AudioSinkItem {

    constructor(sink, control) {
        this._sink = sink || EMPTY_SINK;
        this._control = control;
    }

    get item() {
        if (!this._item)
            this._buildMenuItem();

        return this._item;
    }

    _isDefault() {
        return this._control && this._sink === this._control.get_default_sink();
    }

    _buildMenuItem() {
        this._item = new PopupMenu.PopupMenuItem(this._name);
        this._item.connect('activate', () => {
            this._control.set_default_sink(this._sink);
        });

        if (this._isDefault())
            this._item.actor.add_style_pseudo_class('checked');
    }

    get _name() {
        return this._sink.get_description();
    }

}

class AudioSelector {
    constructor(title, control) {
        this._control = control;
        this._title = title;
        this._signals = [];
    }

    get item() {
        if (!this._item)
            this._buildAudioMenu();

        return this._item;
    }

    _buildAudioMenu() {
        this._createAudioMenu();
        this._buildSinksList();
        this._toggleVisibility();
        this._connectEvents();
    }

    _createAudioMenu() {
        this._item = new PopupMenu.PopupSubMenuMenuItem(this._title, false);
        this._item.menu.addMenuItem(new AudioSinkItem().item);
    }

    _connectEvents() {
        ['card-added', 'card-removed', 'default-sink-changed'].forEach((event) => {
            let eventId = this._control.connect(event, () => {
                this._buildSinksList();
                this._toggleVisibility();
            });
            this._signals.push(eventId);
        });
    }

    _toggleVisibility() {
        if (this._control.get_sinks().length > 1)
            this._item.actor.show();
        else
            this._item.actor.hide();
    }

    _buildSinksList() {
        this._item.menu.removeAll();

        this._control.get_sinks().forEach((sink) => {
            let sinkItem = new AudioSinkItem(sink, this._control);

            this._item.menu.addMenuItem(sinkItem.item);
        });
    }

    destroy() {
        this._signals.forEach((signal) => {
            this._control.disconnect(signal);
        });
        this._item.destroy();
    }
}

function enable() {
    let control = Main.panel.statusArea.aggregateMenu._volume._control;
    audioSelector = new AudioSelector("Urządzenia audio", control);

    Main.panel.statusArea.aggregateMenu._volume._volumeMenu.addMenuItem(audioSelector.item, 0);
}

function disable() {
    audioSelector.destroy();
    audioSelector = null;
}
