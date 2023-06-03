// To parse this data:
//
//   import { Convert, JSONScenario } from "./file";
//
//   const jSONScenario = Convert.toJSONScenario(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface JSONScenario {
    events:      DataStore[];
    services:    Service[];
    states:      DataStore[];
    timers:      Timer[];
    data_stores: DataStore[];
    pay_modes:   DataStore[];
    scenario:    Scenario[];
}

export interface DataStore {
    id:          number;
    name:        string;
    description: string;
}

export interface Scenario {
    event:   number;
    actions: Action[];
}

export interface Action {
    state:           number;
    commands?:       Command[];
    set_data_store?: number;
    set_pay_mode?:   number;
    set_state?:      number;
    start_timer?:    number;
    stop_timer?:     number;
}

export interface Command {
    service:       number;
    wait_result?:  boolean;
    wait_timeout?: number;
    event?:        number;
    data_store?:   number;
    pay_mode?:     number;
    set_state?:    number;
}

export interface Service {
    id:           number;
    name:         string;
    description:  string;
    url:          string;
    error_event?: number;
}

export interface Timer {
    id:           number;
    timeout:      number;
    name:         string;
    expire_event: number;
    description:  string;
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toJSONScenario(json: string): JSONScenario {
        return cast(JSON.parse(json), r("JSONScenario"));
    }

    public static jSONScenarioToJson(value: JSONScenario): string {
        return JSON.stringify(uncast(value, r("JSONScenario")), null, 2);
    }
}

function invalidValue(typ: any, val: any, key: any, parent: any = ''): never {
    const prettyTyp = prettyTypeName(typ);
    const parentText = parent ? ` on ${parent}` : '';
    const keyText = key ? ` for key "${key}"` : '';
    throw Error(`Invalid value${keyText}${parentText}. Expected ${prettyTyp} but got ${JSON.stringify(val)}`);
}

function prettyTypeName(typ: any): string {
    if (Array.isArray(typ)) {
        if (typ.length === 2 && typ[0] === undefined) {
            return `an optional ${prettyTypeName(typ[1])}`;
        } else {
            return `one of [${typ.map(a => { return prettyTypeName(a); }).join(", ")}]`;
        }
    } else if (typeof typ === "object" && typ.literal !== undefined) {
        return typ.literal;
    } else {
        return typeof typ;
    }
}

function jsonToJSProps(typ: any): any {
    if (typ.jsonToJS === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
    if (typ.jsToJSON === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = '', parent: any = ''): any {
    function transformPrimitive(typ: string, val: any): any {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val, key, parent);
    }

    function transformUnion(typs: any[], val: any): any {
        // val must validate against one typ in typs
        const l = typs.length;
        for (let i = 0; i < l; i++) {
            const typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) {}
        }
        return invalidValue(typs, val, key, parent);
    }

    function transformEnum(cases: string[], val: any): any {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases.map(a => { return l(a); }), val, key, parent);
    }

    function transformArray(typ: any, val: any): any {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue(l("array"), val, key, parent);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(val: any): any {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue(l("Date"), val, key, parent);
        }
        return d;
    }

    function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue(l(ref || "object"), val, key, parent);
        }
        const result: any = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps, key, ref);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps, key, ref);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val, key, parent);
    }
    if (typ === false) return invalidValue(typ, val, key, parent);
    let ref: any = undefined;
    while (typeof typ === "object" && typ.ref !== undefined) {
        ref = typ.ref;
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems")    ? transformArray(typ.arrayItems, val)
            : typ.hasOwnProperty("props")         ? transformObject(getProps(typ), typ.additional, val)
            : invalidValue(typ, val, key, parent);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== "number") return transformDate(val);
    return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
    return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
    return transform(val, typ, jsToJSONProps);
}

function l(typ: any) {
    return { literal: typ };
}

function a(typ: any) {
    return { arrayItems: typ };
}

function u(...typs: any[]) {
    return { unionMembers: typs };
}

function o(props: any[], additional: any) {
    return { props, additional };
}

function m(additional: any) {
    return { props: [], additional };
}

function r(name: string) {
    return { ref: name };
}

const typeMap: any = {
    "JSONScenario": o([
        { json: "events", js: "events", typ: a(r("DataStore")) },
        { json: "services", js: "services", typ: a(r("Service")) },
        { json: "states", js: "states", typ: a(r("DataStore")) },
        { json: "timers", js: "timers", typ: a(r("Timer")) },
        { json: "data_stores", js: "data_stores", typ: a(r("DataStore")) },
        { json: "pay_modes", js: "pay_modes", typ: a(r("DataStore")) },
        { json: "scenario", js: "scenario", typ: a(r("Scenario")) },
    ], false),
    "DataStore": o([
        { json: "id", js: "id", typ: 0 },
        { json: "name", js: "name", typ: "" },
        { json: "description", js: "description", typ: "" },
    ], false),
    "Scenario": o([
        { json: "event", js: "event", typ: 0 },
        { json: "actions", js: "actions", typ: a(r("Action")) },
    ], false),
    "Action": o([
        { json: "state", js: "state", typ: 0 },
        { json: "commands", js: "commands", typ: u(undefined, a(r("Command"))) },
        { json: "set_data_store", js: "set_data_store", typ: u(undefined, 0) },
        { json: "set_pay_mode", js: "set_pay_mode", typ: u(undefined, 0) },
        { json: "set_state", js: "set_state", typ: u(undefined, 0) },
        { json: "start_timer", js: "start_timer", typ: u(undefined, 0) },
        { json: "stop_timer", js: "stop_timer", typ: u(undefined, 0) },
    ], false),
    "Command": o([
        { json: "service", js: "service", typ: 0 },
        { json: "wait_result", js: "wait_result", typ: u(undefined, true) },
        { json: "wait_timeout", js: "wait_timeout", typ: u(undefined, 0) },
        { json: "event", js: "event", typ: u(undefined, 0) },
        { json: "data_store", js: "data_store", typ: u(undefined, 0) },
        { json: "pay_mode", js: "pay_mode", typ: u(undefined, 0) },
        { json: "set_state", js: "set_state", typ: u(undefined, 0) },
    ], false),
    "Service": o([
        { json: "id", js: "id", typ: 0 },
        { json: "name", js: "name", typ: "" },
        { json: "description", js: "description", typ: "" },
        { json: "url", js: "url", typ: "" },
        { json: "error_event", js: "error_event", typ: u(undefined, 0) },
    ], false),
    "Timer": o([
        { json: "id", js: "id", typ: 0 },
        { json: "timeout", js: "timeout", typ: 0 },
        { json: "name", js: "name", typ: "" },
        { json: "expire_event", js: "expire_event", typ: 0 },
        { json: "description", js: "description", typ: "" },
    ], false),
};
