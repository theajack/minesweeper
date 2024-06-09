/*
 * @Author: tackchen
 * @Date: 2022-08-03 20:32:39
 * @Description: Coding something
 */

import {Map} from '../../src/index';

import {drag, loading} from 'tacl-ui';
import {query, dom, collectRef, reportStyle} from 'easy-dom-util';
import WebAppBox from 'webapp-box';

WebAppBox.config({
    'clickMaskClose': true,
});

loading('');
const map = new Map();
loading.close();

reportStyle({
    func: `
    .g-loading-mask.tacl-ui{z-index: 10000000;}
    body {
        display: flex;
        align-items: center;
        justify-content: center;
        position: fixed;
        width: 100%;
        height: 100%;
        overflow: auto;
        margin: 0;
    }
    `
});

query('body').append(
    dom.div.style({
        width: '30px',
        height: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0008',
        borderRadius: '5px',
        cursor: 'pointer',
    }).sizeReady((el) => {
        drag({el, onClick () {
            WebAppBox.add(createConfigBox());
        }});
    }).html('<?xml version="1.0" encoding="UTF-8"?><svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18.2838 43.1713C14.9327 42.1736 11.9498 40.3213 9.58787 37.867C10.469 36.8227 11 35.4734 11 34.0001C11 30.6864 8.31371 28.0001 5 28.0001C4.79955 28.0001 4.60139 28.01 4.40599 28.0292C4.13979 26.7277 4 25.3803 4 24.0001C4 21.9095 4.32077 19.8938 4.91579 17.9995C4.94381 17.9999 4.97188 18.0001 5 18.0001C8.31371 18.0001 11 15.3138 11 12.0001C11 11.0488 10.7786 10.1493 10.3846 9.35011C12.6975 7.1995 15.5205 5.59002 18.6521 4.72314C19.6444 6.66819 21.6667 8.00013 24 8.00013C26.3333 8.00013 28.3556 6.66819 29.3479 4.72314C32.4795 5.59002 35.3025 7.1995 37.6154 9.35011C37.2214 10.1493 37 11.0488 37 12.0001C37 15.3138 39.6863 18.0001 43 18.0001C43.0281 18.0001 43.0562 17.9999 43.0842 17.9995C43.6792 19.8938 44 21.9095 44 24.0001C44 25.3803 43.8602 26.7277 43.594 28.0292C43.3986 28.01 43.2005 28.0001 43 28.0001C39.6863 28.0001 37 30.6864 37 34.0001C37 35.4734 37.531 36.8227 38.4121 37.867C36.0502 40.3213 33.0673 42.1736 29.7162 43.1713C28.9428 40.752 26.676 39.0001 24 39.0001C21.324 39.0001 19.0572 40.752 18.2838 43.1713Z" fill="none" stroke="#ffffff" stroke-width="3" stroke-linejoin="round"/><path d="M24 31C27.866 31 31 27.866 31 24C31 20.134 27.866 17 24 17C20.134 17 17 20.134 17 24C17 27.866 20.134 31 24 31Z" fill="none" stroke="#ffffff" stroke-width="3" stroke-linejoin="round"/></svg>'),
);

let configEl: HTMLElement;

function createConfigBox () {
    if (configEl) return configEl;

    const refs = collectRef(
        'width', 'height', 'minesCount', 'tileSize'
    );

    configEl = dom.div.attr('style', `
        margin: 10px;
        display: flex;
        gap: 10px;
        flex-direction: column;
        width: 100%;
    `).append(
        dom.div.append(
            dom.span.text('width: '),
            dom.input.attr('type', 'number').ref(refs.width).value(20),
        ),
        dom.div.append(
            dom.span.text('height: '),
            dom.input.attr('type', 'number').ref(refs.height).value(20),
        ),
        dom.div.append(
            dom.span.text('tile size: '),
            dom.input.attr('type', 'number').ref(refs.tileSize).value(20),
        ),
        dom.div.append(
            dom.span.text('mines count: '),
            dom.input.attr('type', 'number').ref(refs.minesCount).value(40),
        ),
        dom.div.style({color: '#666', textDecoration: 'underline'})
            .text('Show Tips').click(() => {
                WebAppBox.add(createTipBox());
            }),
        dom.div.append(
            dom.button.text('Render Map').click(() => {
                loading('');
                const options: any = {};
                for (const k in refs) {
                    // @ts-ignore
                    options[k] = parseInt(refs[k].value());
                }
                map.config(options);

                loading.close();

            }),
        ),
    ).el;
    return configEl;
}

let tipEl: HTMLElement;

function createTipBox () {
    if (tipEl) return tipEl;

    tipEl = dom.div.attr('style', `
        margin: 10px;
        display: flex;
        gap: 10px;
        flex-direction: column;
        width: 100%;
    `).append(
        dom.div.text('Left-click to display the content'),
        dom.div.text('Right-click to identify the mine'),
        dom.div.text('Double click together to press the logo to be determined'),
        dom.div.text('Click the number key to quickly display the surrounding content'),
    ).el;
    return tipEl;
}