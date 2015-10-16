
var driver = require('./build/Debug/ble_driver_js');

var evt_count = 0;
var connectionHandle = 0;

driver.open(
    'COM19',
    {
        'baudRate': 115200,
        'parity': 'none',
        'flowControl': 'none',
        'eventInterval': 200,
        'logCallback': function(severity, message) {
            if (severity > 0)
            {
                console.log("log: " + severity + ", " + message);
            }
        },
        'eventCallback': function(event_array) {
            console.log("event_array length: " + event_array.length)

            for (var i = 0; i < event_array.length; i++)
            {
                event = event_array[i];
                evt_count = evt_count + 1;
                console.log("evt #" +  evt_count  + ", id: " + event.id + ", name: " + event.name);
                console.log("time:" + event.time);
                //console.log("JSON: %s", JSON.stringify(event));

                if(event.name === 'BLE_GAP_EVT_ADV_REPORT') {
                    console.log("ADDRESS: %s", event.peer_addr.address);
                    console.log("RSSI: %s", event.rssi);
                }
                else if (event.name === 'BLE_GAP_EVT_TIMEOUT') {
                    console.log("Timeout source: %s", event.src);
                }
                else if (event.name === 'BLE_GAP_EVT_CONNECTED')
                {
                    connectionHandle = event.conn_handle;
                    console.log("Connected. Handle: %d", connectionHandle);
                }
                else if (event.name === 'BLE_GATTS_EVT_WRITE')
                {
                    if (event.evt.gatts_evt.params.write.context.char_uuid.uuid == 0x2A37)
                    {
                        var write_data = event.params.write.data[0];
                        m_send_notifications = write_data == driver.BLE_GATT_HVX_NOTIFICATION;
                    }
                }
            }
        }
    },
    function(err) {
        if(err) {
            console.log('Error occurred opening serial port: %d', err);
            return;
        }

        driver.gatts_add_service(1, {'uuid': 0x180D, 'type': driver.BLE_UUID_TYPE_BLE}, function(err, handle) {
            if (err) {
                console.log('Error occured when adding service');
                console.log(err);
                return;
            }

            console.log('Added service with handle %d', handle);

            driver.gatts_add_characteristic(handle,
                                            {
                                                'char_props':
                                                {
                                                    'broadcast': false,
                                                    'read': true,
                                                    'write_wo_resp': false,
                                                    'write': false,
                                                    'notify': true,
                                                    'indicate': false,
                                                    'auth_signed_wr': false
                                                },
                                                'char_ext_props': {'reliable_wr': false, 'wr_aux': false},
                                                'char_user_desc_max_size': 0,
                                                'char_user_desc_size': 0,
                                                'p_char_pf': 0,
                                                'p_user_desc_md': 0,
                                                'p_cccd_md':
                                                {
                                                    'read_perm': {'sm': 1, 'lv': 1},
                                                    'write_perm': {'sm': 1, 'lv': 1},
                                                    'vlen': 0,
                                                    'vloc': driver.BLE_GATTS_VLOC_STACK,
                                                    'rd_auth': 0,
                                                    'wr_auth': 0,
                                                },
                                                'p_sccd_md': 0,
                                            },
                                            {
                                                'p_uuid': {'uuid': 0x2A37, 'type': driver.BLE_UUID_TYPE_BLE},
                                                'p_attr_md': {
                                                    'read_perm': {'sm': 1, 'lv': 1},
                                                    'write_perm': {'sm': 1, 'lv': 1},
                                                    'vlen': 0,
                                                    'vloc': 1,
                                                    'rd_auth': 0,
                                                    'wr_auth': 0,
                                                },
                                                'init_len': 1,
                                                'init_offs': 0,
                                                'max_len': 1,
                                                'p_value': [43],
                                            },
                                            function(err, handles)
            {
                if (err) {
                    console.log('Error occured when adding characteristics');
                    console.log(err);
                    return;
                }

                console.log('Added characteristics with handles %d', handles);

                driver.gap_start_advertisement({
                                                    'type': driver.BLE_GAP_ADV_TYPE_ADV_IND,
                                                    'fp': driver.BLE_GAP_ADV_FP_ANY,
                                                    'interval': 40,
                                                    'timeout': 180,
                                                    'channel_mask': {
                                                        'ch_37_off': 0,
                                                        'ch_38_off': 0,
                                                        'ch_39_off': 0,
                                                    },
                                                },
                                                function(err)
                {
                    if(err) {
                        console.log('Error occured when starting advertisement');
                        console.log(err);
                        return;
                    }

                    console.log('Started advertisement');
                });
            });

        });
    }
);
